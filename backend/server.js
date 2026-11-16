require('dotenv').config()
const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const vision = require('@google-cloud/vision')

const app = express()
const PORT = process.env.PORT || 5001

// Setup uploads directory
const UPLOAD_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// Multer storage and file filter
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedMime = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/gif',
    'application/pdf'
  ]
  if (allowedMime.includes(file.mimetype) || file.originalname.match(/\.(jpe?g|png|webp|gif|pdf)$/i)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, and PDF receipts are allowed.'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, true) // Permissive for local development pairs
    },
    credentials: true
  })
)

app.use(express.json())

// Initialize Google Cloud Vision Client safely
let visionClient = null
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
if (credPath && fs.existsSync(credPath)) {
  try {
    visionClient = new vision.ImageAnnotatorClient({ keyFilename: credPath })
    console.log('[Vision] Google Cloud Vision client initialized from credentials file.')
  } catch (err) {
    console.warn('[Vision] Warning: Failed to initialize Vision client from keyfile:', err.message)
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn(`[Vision] GOOGLE_APPLICATION_CREDENTIALS points to missing file: "${credPath}". Cloud Vision will be unconfigured until valid credentials are provided.`)
} else {
  console.log('[Vision] No GOOGLE_APPLICATION_CREDENTIALS configured. Will fallback to Gemini multimodal extraction if available.')
}

// Initialize Gemini Client safely
let genAI = null
let geminiModel = null
const geminiApiKey = process.env.GEMINI_API_KEY
const modelName = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'

if (geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(geminiApiKey)
    geminiModel = genAI.getGenerativeModel({ model: modelName })
    console.log(`[Gemini] Initialized Gemini client with model: ${modelName}`)
  } catch (err) {
    console.warn('[Gemini] Warning: Failed to initialize Gemini client:', err.message)
  }
} else {
  console.warn('[Gemini] Warning: GEMINI_API_KEY is not set in environment.')
}

// Health check endpoints
const getHealthStatus = () => ({
  status: 'ok',
  service: 'BillStack Backend',
  timestamp: new Date().toISOString(),
  port: PORT,
  visionConfigured: Boolean(visionClient),
  geminiConfigured: Boolean(geminiModel),
  geminiModel: modelName
})

app.get('/', (req, res) => {
  res.json(getHealthStatus())
})

app.get('/health', (req, res) => {
  res.json(getHealthStatus())
})

app.get('/api/health', (req, res) => {
  res.json(getHealthStatus())
})

// Helper to safely parse AI response JSON
function extractJsonFromText(rawText) {
  if (!rawText) return null

  // 1. Try stripping markdown code fences
  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    // 2. Try regex extraction for outermost JSON object
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch (innerErr) {
        // Fallback below
      }
    }
    return null
  }
}

// Normalizer to align returned data with BillStack's frontend data model
function normalizeExtractedData(raw) {
  const data = raw || {}
  const rawAmount = data.totalAmount ?? data.amount ?? ''
  let numericAmount = 0
  if (typeof rawAmount === 'number') {
    numericAmount = rawAmount
  } else if (typeof rawAmount === 'string') {
    const sanitized = rawAmount.replace(/[^0-9.-]/g, '')
    numericAmount = parseFloat(sanitized) || 0
  }

  // Warranty normalization
  let warrantyStr = (data.warranty || '').toString().trim()
  let returnDaysStr = (data.returnPolicy || data.returnDays || '').toString().trim()

  return {
    vendor: (data.vendor || '').toString().trim(),
    invoiceNumber: (data.invoiceNumber || data.receiptNumber || '').toString().trim(),
    date: (data.date || '').toString().trim(),
    items: Array.isArray(data.items) ? data.items : (data.items ? [data.items] : []),
    totalAmount: numericAmount > 0 ? numericAmount : (rawAmount ? String(rawAmount).trim() : ''),
    numericAmount,
    category: (data.category || 'General').toString().trim(),
    warranty: warrantyStr,
    returnPolicy: returnDaysStr
  }
}

// Main upload handler
async function handleUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: 'No bill uploaded. Please submit a file using the "bill" field.'
    })
  }

  const filePath = req.file.path
  console.log(`[Upload] Received receipt: ${req.file.originalname} (${req.file.size} bytes, ${req.file.mimetype})`)

  try {
    let ocrText = ''

    // Step 1: Run Google Cloud Vision OCR if configured
    if (visionClient) {
      try {
        console.log('[Vision] Performing OCR text detection...')
        const [result] = await visionClient.textDetection(filePath)
        ocrText = result?.fullTextAnnotation?.text || ''
        console.log(`[Vision] Extracted ${ocrText.length} characters of OCR text.`)
      } catch (visionErr) {
        console.error('[Vision] OCR failed:', visionErr.message)
      }
    }

    // Step 2: Use Gemini to extract structured receipt data
    let extractedData = null

    if (geminiModel) {
      try {
        let aiResult = null

        // If we have text from Vision, prompt with the OCR text
        if (ocrText && ocrText.trim().length > 0) {
          const prompt = `
You are a bill and receipt data extraction system.

Extract structured information from the following OCR text.

Return ONLY valid JSON in this exact format:

{
  "vendor": "",
  "invoiceNumber": "",
  "date": "",
  "items": [],
  "totalAmount": "",
  "category": "",
  "warranty": "",
  "returnPolicy": ""
}

Rules:
- Do not invent information.
- If a field is not present, use an empty string.
- items should contain the product names found in the bill.
- category should be a simple category such as Electronics, Food, Groceries, Fashion, Health, Travel, Other.

OCR TEXT:
${ocrText}
`
          console.log('[Gemini] Requesting structured extraction from OCR text...')
          aiResult = await geminiModel.generateContent(prompt)
        } else if (req.file.mimetype.startsWith('image/')) {
          // Fallback: If Vision is unconfigured or returned no text, let Gemini multimodal read the image directly!
          console.log('[Gemini] Reading receipt image directly via multimodal vision...')
          const imageBuffer = fs.readFileSync(filePath)
          const imagePart = {
            inlineData: {
              data: imageBuffer.toString('base64'),
              mimeType: req.file.mimetype
            }
          }
          const prompt = `
You are a bill and receipt data extraction system.
Extract structured information directly from this receipt image.
Return ONLY valid JSON in this exact format:
{
  "vendor": "",
  "invoiceNumber": "",
  "date": "",
  "items": [],
  "totalAmount": "",
  "category": "",
  "warranty": "",
  "returnPolicy": ""
}
Rules:
- Do not invent information.
- If a field is not present, use an empty string.
- items should contain the product names found in the bill.
- category should be a simple category such as Electronics, Food, Groceries, Fashion, Health, Travel, Other.
`
          aiResult = await geminiModel.generateContent([prompt, imagePart])
        }

        if (aiResult) {
          const aiResponseText = aiResult.response.text()
          console.log('[Gemini] Raw AI Response received.')
          const parsed = extractJsonFromText(aiResponseText)
          if (parsed) {
            extractedData = normalizeExtractedData(parsed)
          } else {
            console.warn('[Gemini] Could not parse AI response as JSON. Raw was:', aiResponseText)
          }
        }
      } catch (geminiErr) {
        console.error('[Gemini] Extraction error:', geminiErr.message)
      }
    } else {
      console.warn('[Backend] Gemini model is not configured.')
    }

    // If both services failed or produced nothing, build fallback from filename
    if (!extractedData) {
      if (!visionClient && !geminiModel) {
        return res.status(503).json({
          error: 'OCR and AI extraction services are currently unconfigured on the server. Please verify GOOGLE_APPLICATION_CREDENTIALS and GEMINI_API_KEY.',
          filename: req.file.originalname
        })
      }

      // If one service failed, return what we have with a clean fallback
      const cleanName = req.file.originalname.split('.')[0].replace(/[-_]/g, ' ')
      extractedData = normalizeExtractedData({
        vendor: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        category: 'Other',
        date: 'Today'
      })
    }

    res.json({
      message: 'Bill processed successfully',
      filename: req.file.originalname,
      text: ocrText,
      extractedData
    })
  } catch (err) {
    console.error('[Upload] Unexpected processing error:', err)
    res.status(500).json({
      error: 'Failed to process receipt: ' + err.message
    })
  } finally {
    // ALWAYS clean up the temporary upload file to avoid leaking disk space
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`[Upload] Cleaned up temporary file: ${filePath}`)
      }
    } catch (cleanupErr) {
      console.warn('[Upload] Failed to clean up temp file:', cleanupErr.message)
    }
  }
}

// Support both /upload and /api/upload
app.post('/upload', upload.single('bill'), handleUpload)
app.post('/api/upload', upload.single('bill'), handleUpload)

// Error handling middleware for multer errors (like file size or type)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Receipt file exceeds the 10MB size limit.' })
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` })
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'An error occurred during upload.' })
  }
  next()
})

// Start server with port conflict fallback
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ BillStack backend running on port ${PORT}`)
  console.log(`✓ Health endpoint: http://localhost:${PORT}/health`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Error] Port ${PORT} is already in use.`)
    if (PORT === 5000 || PORT === '5000') {
      const fallbackPort = 5001
      console.log(`Attempting fallback to port ${fallbackPort}...`)
      app.listen(fallbackPort, '0.0.0.0', () => {
        console.log(`✓ BillStack backend running on fallback port ${fallbackPort}`)
      })
    }
  } else {
    console.error('[Error] Server error:', err)
  }
})

module.exports = app
require('dotenv').config({
  path: require('path').join(__dirname, '.env')
})

const express = require('express')
const multer = require('multer')
const { GoogleGenerativeAI } = require('@google/generative-ai')

const app = express()
const PORT = process.env.PORT || 5001

// Multer memory storage
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

  if (
    allowedMime.includes(file.mimetype) ||
    /\.(jpe?g|png|webp|gif|pdf)$/i.test(file.originalname)
  ) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, and PDF receipts are allowed.'))
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 4 * 1024 * 1024 }
})

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(express.json())

// Google Vision API configuration
const visionApiKey = process.env.GOOGLE_VISION_API_KEY
console.log('[Vision] API key detected:', Boolean(visionApiKey))

async function performVisionOCR(buffer, mimeType) {
  if (!visionApiKey || mimeType === 'application/pdf') {
    return ''
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: buffer.toString('base64')
            },
            features: [
              {
                type: 'TEXT_DETECTION'
              }
            ]
          }
        ]
      })
    }
  )

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error?.message || 'Google Vision API request failed')
  }

  return result.responses?.[0]?.fullTextAnnotation?.text || ''
}

// Gemini configuration
let geminiModel = null

const geminiApiKey = process.env.GEMINI_API_KEY
const modelName = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'

if (geminiApiKey) {
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey)
    geminiModel = genAI.getGenerativeModel({ model: modelName })

    console.log(`[Gemini] Initialized model: ${modelName}`)
  } catch (err) {
    console.warn('[Gemini] Initialization failed:', err.message)
  }
} else {
  console.warn('[Gemini] GEMINI_API_KEY is not configured.')
}

// Health checks
const getHealthStatus = () => ({
  status: 'ok',
  service: 'BillStack Backend',
  timestamp: new Date().toISOString(),
  visionConfigured: Boolean(visionApiKey),
  geminiConfigured: Boolean(geminiModel),
  geminiModel: modelName
})

app.get('/', (req, res) => res.json(getHealthStatus()))
app.get('/health', (req, res) => res.json(getHealthStatus()))
app.get('/api/health', (req, res) => res.json(getHealthStatus()))

// Extract JSON from Gemini response
function extractJsonFromText(rawText) {
  if (!rawText) return null

  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)

    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        return null
      }
    }

    return null
  }
}

// Normalize extracted data
function normalizeExtractedData(raw) {
  const data = raw || {}
  const rawAmount = data.totalAmount ?? data.amount ?? ''

  let numericAmount = 0

  if (typeof rawAmount === 'number') {
    numericAmount = rawAmount
  } else if (typeof rawAmount === 'string') {
    numericAmount = parseFloat(rawAmount.replace(/[^0-9.-]/g, '')) || 0
  }

  return {
    vendor: (data.vendor || '').toString().trim(),
    invoiceNumber: (data.invoiceNumber || data.receiptNumber || '').toString().trim(),
    date: (data.date || '').toString().trim(),
    items: Array.isArray(data.items) ? data.items : (data.items ? [data.items] : []),
    totalAmount: numericAmount > 0 ? numericAmount : (rawAmount ? String(rawAmount).trim() : ''),
    numericAmount,
    category: (data.category || 'General').toString().trim(),
    warranty: (data.warranty || '').toString().trim(),
    returnPolicy: (data.returnPolicy || data.returnDays || '').toString().trim()
  }
}

// Receipt upload handler
async function handleUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: 'No bill uploaded. Please submit a file using the "bill" field.'
    })
  }

  const file = req.file

  console.log(`[Upload] Received: ${file.originalname} (${file.size} bytes)`)

  try {
    let ocrText = ''

    // Step 1: Google Vision OCR
    if (visionApiKey && file.mimetype !== 'application/pdf') {
      try {
        console.log('[Vision] Performing OCR...')

        ocrText = await performVisionOCR(file.buffer, file.mimetype)

        console.log(`[Vision] Extracted ${ocrText.length} characters.`)
      } catch (err) {
        console.error('[Vision] OCR failed:', err.message)
      }
    }

    // Step 2: Gemini extraction
    let extractedData = null

    if (geminiModel) {
      try {
        const prompt = `
You are a bill and receipt data extraction system.

Extract structured information from the provided receipt.

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
- items should contain product names found in the bill.
- category should be Electronics, Food, Groceries, Fashion, Health, Travel, or Other.
`

        let aiResult

        if (ocrText.trim().length > 0) {
          console.log('[Gemini] Extracting data from OCR text...')

          aiResult = await geminiModel.generateContent(
            `${prompt}\n\nOCR TEXT:\n${ocrText}`
          )
        } else {
          console.log('[Gemini] Processing receipt file directly...')

          const filePart = {
            inlineData: {
              data: file.buffer.toString('base64'),
              mimeType: file.mimetype
            }
          }

          aiResult = await geminiModel.generateContent([
            prompt,
            filePart
          ])
        }

        const responseText = aiResult.response.text()
        const parsed = extractJsonFromText(responseText)

        if (parsed) {
          extractedData = normalizeExtractedData(parsed)
        } else {
          console.warn('[Gemini] Could not parse response as JSON.')
        }
      } catch (err) {
        console.error('[Gemini] Extraction failed:', err.message)
      }
    }

    // Step 3: Fallback
    if (!extractedData) {
      if (!visionApiKey && !geminiModel) {
        return res.status(503).json({
          error: 'OCR and AI extraction services are not configured.',
          filename: file.originalname
        })
      }

      const cleanName = file.originalname
        .split('.')[0]
        .replace(/[-_]/g, ' ')

      extractedData = normalizeExtractedData({
        vendor: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        category: 'Other',
        date: 'Today'
      })
    }

    return res.json({
      message: 'Bill processed successfully',
      filename: file.originalname,
      text: ocrText,
      extractedData
    })

  } catch (err) {
    console.error('[Upload] Processing error:', err)

    return res.status(500).json({
      error: 'Failed to process receipt: ' + err.message
    })
  }
}

// Upload routes
app.post('/upload', upload.single('bill'), handleUpload)
app.post('/api/upload', upload.single('bill'), handleUpload)

// Multer error handling
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Receipt file exceeds the 4MB size limit.'
      })
    }

    return res.status(400).json({
      error: `Upload error: ${err.message}`
    })
  }

  if (err) {
    return res.status(400).json({
      error: err.message || 'An upload error occurred.'
    })
  }

  next()
})

// Local development server
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BillStack backend running on port ${PORT}`)
    console.log(`Health endpoint: http://localhost:${PORT}/health`)
  })
}

// Export for Vercel
module.exports = app
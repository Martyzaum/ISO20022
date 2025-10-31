// validation.js
// Controller para validação de mensagens XML
import { validateAll } from '../../src/validation/validator.js';

export async function validateMessage(req, res) {
  try {
    const { xml, options = {} } = req.body;

    if (!xml) {
      return res.status(400).json({
        success: false,
        error: 'XML content is required'
      });
    }

    const validationOptions = {
      xsd: options.xsd !== false,
      signature: options.signature !== false,
      businessRules: options.businessRules !== false,
      preprocess: options.preprocess !== false,
      resolveCertificateByIssuerSerial: options.resolveCertificateByIssuerSerial
    };

    const result = await validateAll(xml, validationOptions);

    res.json({
      success: true,
      valid: result.valid,
      validation: {
        xsd: result.xsd,
        signature: result.signature,
        businessRules: result.businessRules,
        detected: result.detected
      },
      errors: result.valid ? [] : [
        ...(result.xsd?.errors || []).map(e => ({ type: 'xsd', ...e })),
        ...(result.signature?.errors || []).map(e => ({ type: 'signature', ...e })),
        ...(result.businessRules?.errors || []).map(e => ({ type: 'businessRules', message: e }))
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


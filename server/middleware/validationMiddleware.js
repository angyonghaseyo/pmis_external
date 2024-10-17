const { body, validationResult } = require('express-validator');

const validateRegistration = [
  body('email').isEmail().withMessage('Enter a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain at least one number, one uppercase and lowercase letter, and one special character'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('company').notEmpty().withMessage('Company name is required'),
];

const validateVesselVisit = [
  body('vesselName').notEmpty().withMessage('Vessel name is required'),
  body('imoNumber').isNumeric().isLength({ min: 7, max: 7 }).withMessage('IMO number must be 7 digits'),
  body('eta').isISO8601().toDate().withMessage('Invalid ETA date'),
  body('etd').isISO8601().toDate().withMessage('Invalid ETD date'),
  body('loa').isFloat({ min: 0 }).withMessage('LOA must be a positive number'),
  body('draft').isFloat({ min: 0 }).withMessage('Draft must be a positive number'),
  body('cargoType').notEmpty().withMessage('Cargo type is required'),
  body('cargoVolume').isFloat({ min: 0 }).withMessage('Cargo volume must be a positive number'),
];

const validateCargoManifest = [
  body('vesselName').notEmpty().withMessage('Vessel name is required'),
  body('voyageNumber').notEmpty().withMessage('Voyage number is required'),
  body('cargoDetails').isArray().withMessage('Cargo details must be an array'),
  body('cargoDetails.*.type').notEmpty().withMessage('Cargo type is required for each item'),
  body('cargoDetails.*.weight').isFloat({ min: 0 }).withMessage('Cargo weight must be a positive number'),
];

const validateOperatorRequisition = [
  body('operatorSkill').notEmpty().withMessage('Operator skill is required'),
  body('date').isISO8601().toDate().withMessage('Invalid date'),
  body('time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format (HH:MM)'),
  body('duration').isIn(['1 Hour', '2 Hours', '3 Hours', '4 Hours']).withMessage('Invalid duration'),
];

const validateInquiryFeedback = [
  body('type').isIn(['Inquiry', 'Feedback']).withMessage('Invalid type'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('urgency').isIn(['Low', 'Medium', 'High']).withMessage('Invalid urgency level'),
];

const validateCompanyInfo = [
  body('name').notEmpty().withMessage('Company name is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('country').notEmpty().withMessage('Country is required'),
  body('contactPerson').notEmpty().withMessage('Contact person is required'),
  body('contactEmail').isEmail().withMessage('Invalid contact email'),
  body('contactPhone').isMobilePhone().withMessage('Invalid phone number'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(422).json({
    errors: extractedErrors,
  });
};

module.exports = {
  validateRegistration,
  validateVesselVisit,
  validateCargoManifest,
  validateOperatorRequisition,
  validateInquiryFeedback,
  validateCompanyInfo,
  validate,
};
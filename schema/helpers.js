import Joi from 'joi';
import { helpers } from '../helpers.js';
import { ObjectId } from 'mongodb';

export const schemaHelpers = {
    validate(schema, data) {
        const { error, value } = schema.validate(data);
        if (error) throw helpers.createError(error.details[0].message, 400);
        return value;
    },
    
    validateParams(schema) {
        return (req, res, next) => {
            try {
                req.params = this.validate(schema, req.params);
                next();
            } catch (err) {
                next(err);
            }
        };
    },
    
    validateBody(schema) {
        return async (req, res, next) => {
            try {
                req.body = await this.validate(schema, req.body);
                next();
            } catch (err) {
                next(err);
            }
        };
    },

    validateFields(schema) {
        return async (req, res, next) => {
            try {
                req.body = await this.validate(schema, req.fields);
                next();
            } catch (err) {
                next(err);
            }
        };
    },

    isValidId(value, utils, options) {
        const { keepAsString } = options;
        if (helpers.isOtherCategory(value)) {
            return utils.error('any.invalid', { message: 'cannot be "Other" category' });
        }
        if (!helpers.isValidId(value)) {
            return utils.error('any.invalid', { message: 'invalid mongodb object id' });
        }

        if (keepAsString) {
            return value;
        }
        return ObjectId(value);
    },

    isValidIdOtherAllowed(value, utils, options) {
        const { keepAsString } = options;
        if (helpers.isOtherCategory(value)) {
            return 0;
        }
        if (helpers.isValidId(value)) {
            if (keepAsString) {
                return value;
            }
            return ObjectId(value);
        }
    
        return utils.error('any.invalid', { message: 'invalid mongodb object id' });
    },

    createSchema(fields) {
        const joiFragments = {};
        for (const [field, fieldData] of Object.entries(fields)) {
            let joiFragment;
            const type = fieldData.type;
            if (type === 'string') {
                joiFragment = Joi.string().trim();
                if (fieldData.pattern) {
                    joiFragment.pattern(new RegExp(fieldData.pattern));
                }
                if (fieldData.parseJSON) {
                    joiFragment = joiFragment.custom((value, utils) => {
                        try {
                            const parsedString = JSON.parse(value);
                            return parsedString;
                        }
                        catch (err) {
                            return utils.error('any.invalid', { message: `${field} is not a valid JSON string` });
                        }
                    });
                }
            }
            else if (type === 'number') {
                joiFragment = Joi.number();
            }
            else if (type === 'boolean') {
                joiFragment = Joi.boolean();
            }
            else if (type === 'objectID') {
                const keepAsString = fieldData.keepAsString;
                if (fieldData.otherAllowed) {
                    joiFragment = Joi.alternatives()
                        .try(Joi.string().trim(), Joi.number())
                        .custom((value, utils) => this.isValidIdOtherAllowed(value, utils, { keepAsString }))
                        .messages({ 'any.invalid': '{{#message}}' })
                }
                else {
                    joiFragment = Joi.string().trim()
                        .custom((value, utils) => this.isValidId(value, utils, { keepAsString }))
                        .messages({ 'any.invalid': '{{#message}}' });
                }
            }
            else if (type === 'object') {
                joiFragment = this.createSchema(fieldData.fields);
            }
            else if (type === 'array') {
                const items = this.createSchema({ items: fieldData.items });
                joiFragment = Joi.alternatives().try(
                        Joi.array().items(items.extract('items')).sparse(fieldData.optional),
                        Joi.string().trim().custom((value, utils) => {
                            try {
                                const parsedArray = JSON.parse(value);
                                if (Array.isArray(parsedArray)) {
                                    return Joi.attempt(parsedArray, Joi.array().items(items.extract('items')).sparse(fieldData.optional));
                                }
                                else {
                                    return utils.error('any.invalid', { message: `${field} is not an array or a JSON array` });
                                }
                            }
                            catch (err) {
                                return utils.error('any.invalid', { message: `${field} is not an array or a JSON array (failed JSON.parse)`});
                            }
                        })
                    )
                    .messages({ 'any.invalid': '{{#message}}' });
            }

            if (fieldData.optional) {
                joiFragment = joiFragment.allow('', null);
            }
            else {
                joiFragment = joiFragment.required();
            }
            joiFragments[field] = joiFragment;
        }
        return Joi.object(joiFragments);
    },
};
              
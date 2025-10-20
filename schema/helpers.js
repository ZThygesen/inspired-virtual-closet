import Joi from 'joi';
import { helpers } from '../helpers';
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

    isValidId(value, utils) {
        if (helpers.isOtherCategory(value)) {
            return utils.error('any.invalid', { message: 'cannot be "Other" category' });
        }
        if (!helpers.isValidId(value)) {
            return utils.error('any.invalid', { message: 'invalid mongodb object id' });
        }

        return ObjectId(value);
    },

    isValidIdOtherAllowed(value, utils) {
        if (helpers.isOtherCategory(value)) {
            return 0;
        }
        if (helpers.isValidId(value)) {
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
            }
            else if (type === 'number') {
                joiFragment = Joi.number();
            }
            else if (type === 'boolean') {
                joiFragment = Joi.boolean();
            }
            else if (type === 'objectID') {
                if (fieldData.otherAllowed) {
                    joiFragment = Joi.alternatives()
                        .try(Joi.string().trim(), Joi.number())
                        .custom(schemaHelpers.isValidIdOtherAllowed)
                        .messages({ 'any.invalid': '{{#message}}' })
                }
                else {
                    joiFragment = Joi.string().trim()
                        .custom(this.isValidId)
                        .messages({ 'any.invalid': '{{#message}}' });
                }
            }
            else if (type === 'object') {
                joiFragment = this.createSchema(fieldData.fields);
            }
            else if (type === 'array') {
                const items = this.createSchema({ items: fieldData.items });
                joiFragment = Joi.array().items(items.extract('items'));
            }
            if (!fieldData.optional) {
                joiFragment = joiFragment.required();
            }
            joiFragments[field] = joiFragment;
        }
        return Joi.object(joiFragments);
    },
};
              
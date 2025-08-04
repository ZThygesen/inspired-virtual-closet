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
            return 0;
        }
        if (helpers.isValidId(value)) {
            return ObjectId(value);
        }
    
        return utils.error('any.invalid', { message: 'invalid mongodb object id' });
    },

    isValidIdAndNotOther(value, utils) {
        if (helpers.isOtherCategory(value)) {
            return utils.error('any.invalid', { message: 'cannot be "Other" category' });
        }
        if (!helpers.isValidId(value)) {
            return utils.error('any.invalid', { message: 'invalid mongodb object id' });
        }

        return ObjectId(value);
    },

    generateInvalidStringData(key) {
        return [
            { [key]: '' },
            { [key]: ' ' },
            { [key]: null },
            { [key]: undefined },
            { [key]: 0 },
            { [key]: 123 },
            { [key]: true },
            { [key]: false },
            { [key]: [] },
            { [key]: {} },
            { },
        ];
    },

    generateInvalidIdData(key) {
        return [
            { [key]: 'invalid_id' },
            { [key]: '' },
            { [key]: ' ' },
            { [key]: null },
            { [key]: undefined },
            { [key]: 123 },
            { [key]: true },
            { [key]: false },
            { [key]: [] },
            { [key]: {} },
            { },
        ];
    },

    generateInvalidIdDataNoOther(key) {
        return [
            { [key]: 'invalid_id' },
            { [key]: '0' },
            { [key]: '' },
            { [key]: ' ' },
            { [key]: null },
            { [key]: undefined },
            { [key]: 0 },
            { [key]: 123 },
            { [key]: true },
            { [key]: false },
            { [key]: [] },
            { [key]: {} },
            { },
        ];
    },
};
              
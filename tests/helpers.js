import { ObjectId } from 'mongodb';
import { helpers } from '../helpers';
import RandExp from 'randexp';

export const testHelpers = {
    generateGoodData(fieldData, options = {}) {
        let goodData = [];
        const type = fieldData.type;
        const optional = fieldData.optional || false;
        if (type === 'string') {
            if (optional) {
                goodData.push('', ' ', null, undefined);
            }
            if (fieldData.pattern) {
                const randexp = new RandExp(new RegExp(fieldData.pattern));
                goodData.push(randexp.gen());
            }
            else {
                goodData.push('valid string'); 
            }
            if (fieldData.parseJSON) {
                goodData = goodData.map(value => JSON.stringify(value));
            }
        }
        else if (type === 'number') {
            if (optional) {
                goodData.push('', ' ', null, undefined);
            }
            goodData.push(0, 1, 123);
        }
        else if (type === 'boolean') {
            if (optional) {
                goodData.push(undefined);
            }
            goodData.push(true, false);
        }
        else if (type === 'objectID') {
            if (fieldData.otherAllowed) {
                goodData.push('0', 0);
            }
            goodData.push(ObjectId().toString());
        }
        else if (type === 'object') {

        }
        else if (type === 'array') {
            if (optional) {
                goodData.push([], '[]');
            }
            const itemsGoodData = this.generateGoodData(fieldData.items);
            itemsGoodData.forEach((item) => {
                goodData.push([item], JSON.stringify([item]));
            });
        }

        return goodData;
    },

    generateBadData(fieldData, options = {}) {
        const { isIntegrationParams, isFormData } = options;
        let badData = [];
        const type = fieldData.type;
        const optional = fieldData.optional || false;
        if (type === 'string') {
            if (!optional) {
                badData.push('', ' ', null, undefined);
            }
            // numbers and booleans are interpreted as strings in form data
            if (!isFormData) {
                badData.push(0, 123, true, false);
            }
            if (fieldData.parseJSON) {
                badData.push('not a json string', '{ "invalid": json }', '["invalid", "json",]');
            }
            badData.push([], {});
        }
        else if (type === 'number') {
            if (!optional) {
                badData.push('', ' ', null, undefined);
            }
            badData.push('123', true, false, [], {});
        }
        else if (type === 'boolean') {
            if (!optional) {
                badData.push('', ' ', null, undefined);
            }
            badData.push('not a boolean', [], {});
        }
        else if (type === 'objectID') {
            if (!fieldData.otherAllowed) {
                badData.push('0', 0);
            }
            if (!optional) {
                badData.push(null, undefined)
            }
            badData.push('invalid_id', {}, 123, true, false, []);
        }
        else if (type === 'object') {

        }
        else if (type === 'array') {
            if (!optional) {
                badData.push([], '[]', null, undefined, 'invalid array', '["invalid", "array]');
            }

            const itemsBadData = this.generateBadData(fieldData.items, options);
            itemsBadData.forEach((item) => {
                // form data requires arrays be stringified
                if (isFormData) {
                    badData.push(JSON.stringify([item]));
                }
                else {
                    badData.push([item], JSON.stringify([item]));
                }
            });
        }

        // when params are passed into a request they are treated differently
        // we need to remove the "empty" cases as they cause 404s
        // they also behave the same as form data
        if (isIntegrationParams || isFormData) {
            badData = badData.filter(value => (
                value !== '' &&
                value !== ' ' &&
                JSON.stringify(value) !== JSON.stringify([]) &&
                JSON.stringify(value) !== JSON.stringify({}) &&
                value !== null &&
                value !== undefined
            ));
        }

        return badData;
    },

    getErrorMessage(field, fieldData, badValue, options = {}) {
        const { isIntegrationParams, isFormData, checkPermissions } = options;
        if (fieldData.type === 'array' && Array.isArray(badValue)) {
            return this.getErrorMessage(field, fieldData.items, badValue[0], options);
        }
        else if (fieldData.type === 'objectID') {
            // when params are passed into a request they are converted into strings (so all pass the string requirement)
            // we need to handle the data slightly different in this case
            if (checkPermissions && field === 'clientId') {
                return new RegExp(/client id is invalid or missing/);
            }
            else if (isIntegrationParams || isFormData) {
                if (helpers.isOtherCategory(badValue) && !fieldData.otherAllowed) {
                    return new RegExp(/cannot be "Other" category/);
                }
                if (!helpers.isValidId(badValue)) {
                    return new RegExp(/invalid mongodb object id/);
                }
            }
            else {
                if (badValue === 'invalid_id' 
                    || (fieldData.otherAllowed && (((typeof badValue === 'number' && badValue !== 0) || (typeof badValue === 'string' && badValue !== '0'))))
                ) {
                    return new RegExp(/invalid mongodb object id/);
                }
                else if (!fieldData.otherAllowed && badValue === '0') {
                    return new RegExp(/cannot be "Other" category/);
                }
            }
        }
        return new RegExp(field);
    },
};
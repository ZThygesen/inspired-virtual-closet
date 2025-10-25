import { ObjectId } from 'mongodb';
import { helpers } from '../helpers';

export const testHelpers = {
    generateGoodData(fieldData) {
        const goodData = [];
        const type = fieldData.type;
        const optional = fieldData.optional || false;
        if (type === 'string') {
            if (optional) {
                goodData.push('', ' ', null, undefined);
            }
            goodData.push('valid string');
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
                goodData.push([], null, undefined);
            }
            const itemsGoodData = this.generateGoodData(fieldData.items);
            itemsGoodData.forEach((item) => {
                goodData.push([item]);
            });
        }
        return goodData;
    },

    generateBadData(fieldData, isIntegrationParams = false) {
        let badData = [];
        const type = fieldData.type;
        const optional = fieldData.optional || false;
        if (type === 'string') {
            if (!optional) {
                badData.push('', ' ', null, undefined);
            }
            badData.push(0, 123, true, false, [], {});
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
            badData.push('invalid_id', {}, '', ' ', null, undefined, 123, true, false, []);
        }
        else if (type === 'object') {

        }
        else if (type === 'array') {
            if (!optional) {
                badData.push([], null, undefined);
            }
            const itemsBadData = this.generateBadData(fieldData.items, isIntegrationParams);
            itemsBadData.forEach((item) => {
                badData.push([item]);
            });
        }

        // when params are passed into a request they are treated differently
        // we need to remove the "empty" cases as they cause 404s
        if (isIntegrationParams) {
            badData = badData.filter(value => (
                value !== '' &&
                value !== ' ' &&
                JSON.stringify(value) !== JSON.stringify([]) &&
                value !== null &&
                value !== undefined
            ));
        }
        return badData;
    },

    getErrorMessage(field, fieldData, badValue, isIntegrationParams = false) {
        if (fieldData.type === 'array' && Array.isArray(badValue)) {
            return this.getErrorMessage(field, fieldData.items, badValue[0], isIntegrationParams);
        }
        else if (fieldData.type === 'objectID') {
            // when params are passed into a request they are converted into strings (so all pass the string requirement)
            // we need to handle the data slightly different in this case
            if (isIntegrationParams) {
                if (helpers.isOtherCategory(badValue) && !fieldData.otherAllowed) {
                    return new RegExp(/cannot be "Other" category/);
                }
                if (!helpers.isValidId(badValue)) {
                    return new RegExp(/invalid mongodb object id/);
                }
            }
            else {
                if (badValue === 'invalid_id' 
                    || (fieldData.otherAllowed && typeof badValue === 'number' && badValue !== 0)
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
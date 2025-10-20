import { testHelpers } from '../helpers';

export const schemaTestHelpers = {
    test(schema, fields) {
        for (const [field, fieldData] of Object.entries(fields)) {
            const goodValues = testHelpers.generateGoodData(fieldData);
            goodValues.forEach((value) => {
                const entry = {};
                for (const [otherField, otherFieldData] of Object.entries(fields)) {
                    if (otherField !== field) {
                        const otherValue = testHelpers.generateGoodData(otherFieldData)[0];
                        entry[otherField] = otherValue;
                    }
                }
                entry[field] = value;
                it (`should validate: ${JSON.stringify(entry)}`, () => {
                    const { error } = schema.validate(entry);
                    expect(error).toBeUndefined();
                });
            });

            const badValues = testHelpers.generateBadData(fieldData);
            badValues.forEach((value) => {
                const entry = {};
                for (const [otherField, otherFieldData] of Object.entries(fields)) {
                    if (otherField !== field) {
                        const otherValue = testHelpers.generateGoodData(otherFieldData)[0];
                        entry[otherField] = otherValue;
                    }
                }
                entry[field] = value;
                const message = testHelpers.getErrorMessage(field, fieldData, value);
                it (`should fail with invalid ${field}: ${JSON.stringify(entry)}: ${message}`, () => {
                    const { error } = schema.validate(entry);
                    expect(error).toBeDefined();
                    expect(error.message).toMatch(message);
                });
            });
        }
    },
};
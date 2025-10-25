import { schema } from '../../schema/categories.schema';
import { schemaTestHelpers } from './helpers';

describe('categories', () => {
    Object.keys(schema).forEach(method => {
        describe(method, () => {
            Object.keys(schema[method]).forEach(type => {
                describe(type, () => {
                    schemaTestHelpers.test(schema[method][type].schema, schema[method][type].fields);
                });
            });
        });
    });
});
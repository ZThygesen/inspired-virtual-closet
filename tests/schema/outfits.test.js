import { schema } from '../../schema/outfits.schema';
import { schemaTestHelpers } from './helpers';

describe('outfits', () => {
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
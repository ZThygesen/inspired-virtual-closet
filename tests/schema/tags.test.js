import { schema } from '../../schema/tags.schema';
import { schemaTestHelpers } from './helpers';

describe('tags', () => {
    describe('postGroup', () => {
        describe('body', () => {
            schemaTestHelpers.test(schema.postGroup.body.schema, schema.postGroup.body.fields);
        });
    });

    describe('patchGroup', () => {
        describe('params', () => {
            schemaTestHelpers.test(schema.patchGroup.params.schema, schema.patchGroup.params.fields);
        });
        describe('body', () => {
            schemaTestHelpers.test(schema.patchGroup.body.schema, schema.patchGroup.body.fields);
        });
    });

    describe('patchGroupOrder', () => {
        describe('body', () => {
            schemaTestHelpers.test(schema.patchGroupOrder.body.schema, schema.patchGroupOrder.body.fields);
        });
    });

    describe('deleteGroup', () => {
        describe('params', () => {
            schemaTestHelpers.test(schema.deleteGroup.params.schema, schema.deleteGroup.params.fields);
        });
    });
    describe('postTag', () => {
        describe('params', () => {
            schemaTestHelpers.test(schema.postTag.params.schema, schema.postTag.params.fields);
        });
        describe('body', () => {
            schemaTestHelpers.test(schema.postTag.body.schema, schema.postTag.body.fields);
        });
    });
    describe('patchTag', () => {
        describe('params', () => {
            schemaTestHelpers.test(schema.patchTag.params.schema, schema.patchTag.params.fields);
        });
        describe('body', () => {
            schemaTestHelpers.test(schema.patchTag.body.schema, schema.patchTag.body.fields);
        });
    });
    describe('patchTagGroup', () => {
        describe('params', () => {
            schemaTestHelpers.test(schema.patchTagGroup.params.schema, schema.patchTagGroup.params.fields);
        });
        describe('body', () => {
            schemaTestHelpers.test(schema.patchTagGroup.body.schema, schema.patchTagGroup.body.fields);
        });
    });
    describe('archiveTag', () => {
        describe('params', () => {
            schemaTestHelpers.test(schema.archiveTag.params.schema, schema.archiveTag.params.fields);
        });
    });
    describe('recoverTag', () => {
        describe('params', () => {
            schemaTestHelpers.test(schema.recoverTag.params.schema, schema.recoverTag.params.fields);
        });
    });
    describe('deleteTag', () => {
        describe('params', () => {
            schemaTestHelpers.test(schema.deleteTag.params.schema, schema.deleteTag.params.fields);
        });
    });
});
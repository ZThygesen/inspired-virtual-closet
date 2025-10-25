import { schemaHelpers } from './helpers';

const schema = {
    post: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                },
            },
        },
        body: {
            fields: {
                fileSrc: {
                    type: 'string',
                },
                fullFileName: {
                    type: 'string',
                },
                categoryId: {
                    type: 'objectID',
                },
                tags: {
                    type: 'array',
                    items: {
                        type: 'objectID',
                    },
                },
                rmbg: {
                    type: 'boolean',
                },
                crop: {
                    type: 'boolean',
                    optional: true,
                },
            },
        },
    },
};

schema.post.params.schema = schemaHelpers.createSchema(schema.post.params.fields);
schema.post.body.schema = schemaHelpers.createSchema(schema.post.body.fields);

export { schema };
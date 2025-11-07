import { schemaHelpers } from './helpers.js';

const schema = {
    post: {
        body: {
            fields: {
                name: { 
                    type: 'string',
                },
                group: {
                    type: 'string',
                },
            },
        },
    },
    patch: {
        params: {
            fields: {
                categoryId: {
                    type: 'objectID',
                },
            },
        },
        body: {
            fields: {
                name: { 
                    type: 'string',
                },
                group: {
                    type: 'string',
                },
            },
        },
    },
    delete: {
        params: {
            fields: {
                categoryId: {
                    type: 'objectID',
                },
            },
        },
    },
};

Object.keys(schema).forEach(method => {
    Object.keys(schema[method]).forEach(type => {
        schema[method][type].schema = schemaHelpers.createSchema(schema[method][type].fields);
    });
});

export { schema };
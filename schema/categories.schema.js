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
                    optional: true,
                },
                type: {
                    type: 'string',
                    pattern: '(clothes|profile)',
                },
                clientViewItems: {
                    type: 'boolean',
                },
                clientAddItems: {
                    type: 'boolean',
                },
                rmbgItems: {
                    type: 'boolean',
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
                type: {
                    type: 'string',
                    pattern: '(clothes|profile)',
                },
                clientViewItems: {
                    type: 'boolean',
                },
                clientAddItems: {
                    type: 'boolean',
                },
                rmbgItems: {
                    type: 'boolean',
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
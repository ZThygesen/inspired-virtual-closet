import { schemaHelpers } from './helpers.js';

const schema = {
    post: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                    keepAsString: true,
                },
            },
        },
        body: {
            fields: {
                categoryId: {
                    type: 'objectID',
                    otherAllowed: true,
                    keepAsString: true,
                },
                fileSrc: {
                    type: 'string',
                    pattern: 'data:image/(png|jpg|jpeg);base64',
                },
                fullFileName: {
                    type: 'string',
                },
                tags: {
                    type: 'array',
                    optional: true,
                    items: {
                        type: 'objectID',
                        optional: true,
                        keepAsString: true,
                    },
                },
                rmbg: {
                    type: 'boolean',
                },
                crop: {
                    type: 'boolean',
                },
            },
        },
    },
    get: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                    keepAsString: true,
                },
            },
        },
    },
    patchName: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                },
                itemId: {
                    type: 'objectID',
                },
            },
        },
        body: {
            fields: {
                name: {
                    type: 'string',
                },
                tags: {
                    type: 'array',
                    optional: true,
                    items: {
                        type: 'objectID',
                        optional: true,
                        keepAsString: true,
                    },
                },
            },
        },
    },
    patchCategory: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                },
                itemId: {
                    type: 'objectID',
                },
            },
        },
        body: {
            fields: {
                newCategoryId: {
                    type: 'objectID',
                    otherAllowed: true,
                    keepAsString: true,
                },
            },
        },
    },
    delete: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                },
                itemId: {
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
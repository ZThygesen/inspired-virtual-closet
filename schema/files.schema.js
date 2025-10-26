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
                },
            },
        },
    },
    get: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                },
            },
        },
    },
    patchName: {
        params: {
            fields: {
                categoryId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
                gcsId: {
                    type: 'string',
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
                    items: {
                        type: 'objectID',
                    },
                },
            },
        },
    },
    patchCategory: {
        params: {
            fields: {
                categoryId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
                gcsId: {
                    type: 'string',
                },
            },
        },
        body: {
            fields: {
                newCategoryId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
            },
        },
    },
    delete: {
        params: {
            fields: {
                categoryId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
                gcsId: {
                    type: 'string',
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
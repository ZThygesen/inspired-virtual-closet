import { schemaHelpers } from './helpers';

const schema = {
    post: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                },
                categoryId: {
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
                clientId: {
                    type: 'objectID',
                },
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
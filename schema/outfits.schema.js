import { schemaHelpers } from "./helpers";

const schema = {
    post: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                    keepAsString: true,
                }
            },
        },
        body: {
            fields: {
                fileSrc: {
                    type: 'string',
                    pattern: 'data:image/(png|jpg|jpeg);base64',
                },
                stageItems: {
                    type: 'string',
                    parseJSON: true,
                },
                outfitName: {
                    type: 'string',
                },
                filesUsed: {
                    type: 'array',
                    optional: true,
                    items: {
                        type: 'string',
                        optional: true,
                    },
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
    patchFull: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                },
                outfitId: {
                    type: 'objectID',
                },
            },
        },
        body: {
            fields: {
                fileSrc: {
                    type: 'string',
                    pattern: 'data:image/(png|jpg|jpeg);base64',
                },
                stageItems: {
                    type: 'string',
                    parseJSON: true,
                },
                outfitName: {
                    type: 'string',
                },
                filesUsed: {
                    type: 'array',
                    optional: true,
                    items: {
                        type: 'string',
                        optional: true,
                    },
                },
                gcsDest: {
                    type: 'string',
                },
            },
        },
    },
    patchPartial: {
        params: {
            fields: {
                clientId: {
                    type: 'objectID',
                },
                outfitId: {
                    type: 'objectID',
                },
            },
        },
        body: {
            fields: {
                outfitName: {
                    type: 'string',
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
                outfitId: {
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
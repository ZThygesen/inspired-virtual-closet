import { schemaHelpers } from './helpers.js';

const schema = {
    postGroup: {
        body: {
            fields: {
                tagGroupName: { 
                    type: 'string',
                },
            },
        },
    },
    patchGroup: {
        params: {
            fields: {
                tagGroupId: { 
                    type: 'objectID',
                },
            },
        },
        body: {
            fields: {
                tagGroupName: { 
                    type: 'string',
                },
            },
        },
    },
    patchGroupOrder: {
        body: {
            fields: {
                tagGroups: { 
                    type: 'array',
                    items: {
                        type: 'objectID',
                        otherAllowed: true,
                    },
                },
            },
        },
    },
    deleteGroup: {
        params: {
            fields: {
                tagGroupId: {
                    type: 'objectID',
                },
            },
        },
    },
    postTag: {
        params: {
            fields: {
                tagGroupId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
            },
        },
        body: {
            fields: {
                tagName: {
                    type: 'string',
                },
                tagColor: {
                    type: 'string',
                },
            },
        },
    },
    patchTag: {
        params: {
            fields: {
                tagGroupId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
                tagId: {
                    type: 'objectID',
                },
            },
        },
        body: {
            fields: {
                tagName: {
                    type: 'string',
                },
                tagColor: {
                    type: 'string',
                },
            },
        },
    },
    patchTagGroup: {
        params: {
            fields: {
                tagGroupId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
                tagId: {
                    type: 'objectID',
                },
            },
        },
        body: {
            fields: {
                newTagGroupId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
            },
        },
    },
    archiveTag: {
        params: {
            fields: {
                tagGroupId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
                tagId: {
                    type: 'objectID',
                },
            },
        },                
    },
    recoverTag: {
        params: {
            fields: {
                tagGroupId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
                tagId: {
                    type: 'objectID',
                },
            },
        },
    },
    deleteTag: {
        params: {
            fields: {
                tagGroupId: {
                    type: 'objectID',
                    otherAllowed: true,
                },
                tagId: {
                    type: 'objectID',
                },
            },
        },
    },
};

schema.postGroup.body.schema = schemaHelpers.createSchema(schema.postGroup.body.fields);
schema.patchGroup.params.schema = schemaHelpers.createSchema(schema.patchGroup.params.fields);
schema.patchGroup.body.schema = schemaHelpers.createSchema(schema.patchGroup.body.fields);
schema.patchGroupOrder.body.schema = schemaHelpers.createSchema(schema.patchGroupOrder.body.fields);
schema.deleteGroup.params.schema = schemaHelpers.createSchema(schema.deleteGroup.params.fields);
schema.postTag.params.schema = schemaHelpers.createSchema(schema.postTag.params.fields);
schema.postTag.body.schema = schemaHelpers.createSchema(schema.postTag.body.fields);
schema.patchTag.params.schema = schemaHelpers.createSchema(schema.patchTag.params.fields);
schema.patchTag.body.schema = schemaHelpers.createSchema(schema.patchTag.body.fields);
schema.patchTagGroup.params.schema = schemaHelpers.createSchema(schema.patchTagGroup.params.fields);
schema.patchTagGroup.body.schema = schemaHelpers.createSchema(schema.patchTagGroup.body.fields);
schema.archiveTag.params.schema = schemaHelpers.createSchema(schema.archiveTag.params.fields);
schema.recoverTag.params.schema = schemaHelpers.createSchema(schema.recoverTag.params.fields);
schema.deleteTag.params.schema = schemaHelpers.createSchema(schema.deleteTag.params.fields);

export { schema };
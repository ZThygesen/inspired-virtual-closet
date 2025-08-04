import Joi from 'joi';
import { schemaHelpers } from './helpers';

/* --- Tag groups ------------------------------------------ */
// postGroup
const postGroupBody = Joi.object({
    tagGroupName: Joi.string()
        .trim()
        .required(),
});

// patchGroup
const patchGroupParams = Joi.object({
    tagGroupId: Joi.string()
        .trim()
        .required()
        .custom(schemaHelpers.isValidIdAndNotOther),
});
const patchGroupBody = Joi.object({
    tagGroupName: Joi.string()
        .trim()
        .required(),
});

// patchGroupOrder
const patchGroupOrderBody = Joi.object({
    tagGroups: Joi.array().items(
        Joi.object({
            _id: Joi.alternatives()
                .try(
                    Joi.string().trim().custom(schemaHelpers.isValidId),
                    Joi.number().custom(schemaHelpers.isValidId)
                )
                .required()
        })
        .required()
    )
    .required(),
});

// deleteGroup
const deleteGroupParams = Joi.object({
    tagGroupId: Joi.string()
        .trim()
        .required()
        .custom(schemaHelpers.isValidIdAndNotOther),
});

/* --- Tags ------------------------------------------ */
// post
const postTagBody = Joi.object({
    tagName: Joi.string()
        .trim()
        .min(1)
        .required(),
    tagColor: Joi.string()
        .required(),
});

// get

// patch

// delete

export const schema = {
    // tag groups
    postGroupBody,
    patchGroupParams,
    patchGroupBody,
    patchGroupOrderBody,
    deleteGroupParams,
    // tags
    postTagBody,
};
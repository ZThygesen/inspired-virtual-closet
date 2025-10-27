import { ObjectId } from 'mongodb';
import { integrationHelpers } from './helpers';
import { schema } from '../../schema/tags.schema';

describe('tags', () => {
    let user, client, db, collection, clientCollection;
    beforeAll(async () => { await integrationHelpers.beforeAll('tags'); });
    afterAll(async () => { await integrationHelpers.afterAll(); });
    beforeEach(async () => { 
        await integrationHelpers.beforeEach();
        ({ 
            user, 
            client, 
            db, 
            collection, 
            clientCollection 
        } = integrationHelpers);
        await insertOther(); 
    });
    afterEach(async () => { 
        await integrationHelpers.afterEach();
    });

    async function insertOther() {
        await collection.insertOne({ _id: 0, tagGroupName: 'Other', tags: [] });
    }

    describe('postGroup', () => {
        let params, body;
        beforeEach(() => {
            params = [];
            body = { tagGroupName: 'Cool new tag group' };
        });

        const request = (params, body) => integrationHelpers.executeRequest('post', '/tags/group', params, body);

        it('should create new tag group', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            const tagGroup = await collection.findOne({ tagGroupName: body.tagGroupName });
            expect(ObjectId.isValid(tagGroup._id)).toBe(true);
            expect(tagGroup).toMatchObject({
                tagGroupName: body.tagGroupName,
                sortOrder: 1,
                state: 'active',
                tags: [],
            });
        });

        it('should create new tag group with sort order 2', async () => {
            await collection.insertOne({ tagGroupName: 'First tag group' });
            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            const tagGroup = await collection.findOne({ tagGroupName: body.tagGroupName });
            expect(tagGroup.sortOrder).toBe(2);
        });

        it('should fail if tag group name already exists', async () => {
            await collection.insertOne({ tagGroupName: body.tagGroupName });
            const response = await request(params, body);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a tag group named "${body.tagGroupName}" already exists`);
        });

        integrationHelpers.testBody(schema.postGroup.body.fields, request, () => params);
    });

    describe('patchGroup', () => {
        let data, params, body;
        beforeEach(async () => {
            data = {
                _id: ObjectId(),
                tagGroupName: 'Cool new tag group',
                sortOrder: 3,
                state: 'active',
                tags: [],
            };
            await collection.insertOne(data);
            params = [data._id.toString()];
            body = { tagGroupName: 'Updated tag group name' };
        }); 

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/tags/group', params, body);

        it('should update tag group', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedGroup = await collection.findOne({ _id: data._id });
            expect(updatedGroup).toMatchObject({
                _id: data._id,
                tagGroupName: body.tagGroupName,
                sortOrder: data.sortOrder,
                state: data.state,
                tags: data.tags,
            });
        });

        it('should fail if tag group already exists', async () => {
            await collection.insertOne({ tagGroupName: body.tagGroupName });
            const response = await request(params, body);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a tag group named "${body.tagGroupName}" already exists`);

            const tagGroup = await collection.findOne({ _id: data._id });
            expect(tagGroup).toStrictEqual(data);
        });

        it('should fail with non-existent tag group id', async () => {
            params = [ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to update tag group');

            const tagGroup = await collection.findOne({ _id: data._id });
            expect(tagGroup).toStrictEqual(data);
        });

        integrationHelpers.testParams(schema.patchGroup.params.fields, request, () => body, ['tagGroupId']);
        integrationHelpers.testBody(schema.patchGroup.body.fields, request, () => params);
    });

    describe('patchGroupOrder', () => {
        let params, body;
        let group0, group1, group2;
        beforeEach(async () => {
            await integrationHelpers.clearCollection();
            group0 = { _id: ObjectId(), tagGroupName: 'Tag group 1', sortOrder: 0 };
            group1 = { _id: 0, tagGroupName: 'Other tag group', sortOrder: 1 };
            group2 = { _id: ObjectId(), tagGroupName: 'Tag group 2', sortOrder: 2 };
            await collection.insertMany([group0, group1, group2]);
            params = [];
            body = { 
                tagGroups: [
                    group2._id.toString(),
                    group0._id.toString(),
                    group1._id,
                ],
            };
        }); 

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/tags/group-order', params, body);

        it('should update tag group order', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');
        
            const updatedGroups = await collection.find().toArray();
            updatedGroups.sort((a, b) => a.sortOrder - b.sortOrder);
            expect(updatedGroups[0]._id.toString()).toBe(group2._id.toString());
            expect(updatedGroups[0].sortOrder).toBe(0);
            expect(updatedGroups[1]._id.toString()).toBe(group0._id.toString());
            expect(updatedGroups[1].sortOrder).toBe(1);
            expect(updatedGroups[2]._id.toString()).toBe(group1._id.toString());
            expect(updatedGroups[2].sortOrder).toBe(2);
        });

        it('should work if order is the same', async () => {
            body = {
                tagGroups: [
                    group0._id.toString(),
                    group1._id,
                    group2._id.toString(),
                ],
            }
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');
        
            const updatedGroups = await collection.find().toArray();
            updatedGroups.sort((a, b) => a.sortOrder - b.sortOrder);
            expect(updatedGroups[0]._id.toString()).toBe(group0._id.toString());
            expect(updatedGroups[0].sortOrder).toBe(0);
            expect(updatedGroups[1]._id.toString()).toBe(group1._id.toString());
            expect(updatedGroups[1].sortOrder).toBe(1);
            expect(updatedGroups[2]._id.toString()).toBe(group2._id.toString());
            expect(updatedGroups[2].sortOrder).toBe(2);
        });

        integrationHelpers.testBody(schema.patchGroupOrder.body.fields, request, () => params);
    });

    describe('deleteGroup', () => {
        let params, body;
        let data;
        beforeEach(async () => {
            data = {
                _id: ObjectId(),
                tagGroupName: 'Cool new tag group',
                tags: [{ tag: 1 }, { tag: 2 }, { tag: 3 }],
            };
            await collection.insertOne(data);

            params = [data._id.toString()];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('delete', '/tags/group', params, body);

        it('should delete group', async () => {
            let otherGroup = await collection.findOne({ _id: 0, tagGroupName: 'Other' }); 
            expect(otherGroup.tags).toHaveLength(0);

            let group = await collection.findOne({ _id: data._id });
            expect(group.tags).toHaveLength(3);
            expect(group.tags).toEqual(data.tags);

            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            group = await collection.findOne({ _id: data._id });
            expect(group).toBeFalsy();

            otherGroup = await collection.findOne({ _id: 0, tagGroupName: 'Other' }); 
            expect(otherGroup.tags).toHaveLength(3);
            expect(otherGroup.tags).toEqual(data.tags);
        });

        it('should delete group with no tags to move', async () => {
            await integrationHelpers.clearCollection();
            await insertOther();
            await collection.insertOne({ _id: data._id, tagGroupName: data.tagGroupName, tags: [] });

            let otherGroup = await collection.findOne({ _id: 0, tagGroupName: 'Other' }); 
            expect(otherGroup.tags).toHaveLength(0);

            let group = await collection.findOne({ _id: data._id });
            expect(group.tags).toHaveLength(0);

            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            group = await collection.findOne({ _id: data._id });
            expect(group).toBeFalsy();

            otherGroup = await collection.findOne({ _id: 0, tagGroupName: 'Other' }); 
            expect(otherGroup.tags).toHaveLength(0);
        });

        it('should fail given group that does not exist', async () => {
            params = [ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('tag group does not exist');

            const tagGroups = await collection.find({ }).toArray();
            expect(tagGroups).toHaveLength(2);
        });

        integrationHelpers.testParams(schema.deleteGroup.params.fields, request, () => body, ['tagGroupId']);
    });

    describe('postTag', () => {
        let group;
        let params, body;
        beforeEach(async () => {
            group = {
                _id: ObjectId(),
                tagGroupName: 'Cool tag group',
                tags: [],
            };
            await collection.insertOne(group);
            params = [group._id.toString()];
            body = {
                tagName: 'Cool new tag',
                tagColor: '#FFFFFF',
            };
        });

        const request = (params, body) => integrationHelpers.executeRequest('post', '/tags/tag', params, body);

        it('should create new tag', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            const tagGroup = await collection.findOne({ _id: group._id });
            expect(tagGroup.tags).toHaveLength(1);
            const tag = tagGroup.tags[0];
            expect(ObjectId.isValid(tag.tagId)).toBe(true);
            expect(tag).toMatchObject({
                tagName: body.tagName,
                tagColor: body.tagColor,
                state: 'active',
            });
        });

        it('should create new tag in Other group', async () => {
            params = [0];
            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            const tagGroup = await collection.findOne({ _id: 0 });
            expect(tagGroup.tags).toHaveLength(1);
            const tag = tagGroup.tags[0];
            expect(ObjectId.isValid(tag.tagId)).toBe(true);
            expect(tag).toMatchObject({
                tagName: body.tagName,
                tagColor: body.tagColor,
                state: 'active',
            });
        });

        it('should add tag to group that already has tags', async () => {
            await integrationHelpers.clearCollection();
            await insertOther();
            group.tags = [{ tag: 1 }, { tag: 2 }];
            await collection.insertOne(group);

            const response = await request(params, body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            const tagGroup = await collection.findOne({ _id: group._id });
            expect(tagGroup.tags).toHaveLength(3);
            const tag = tagGroup.tags.filter(tag => tag.tagName === body.tagName);
            expect(tag.toBeTruthy);
        });

        it('should fail with non-existent tag group', async () => {
            params = [ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('tag was not inserted into database');
        });

        integrationHelpers.testParams(schema.postTag.params.fields, request, () => body, ['tagGroupId']);
        integrationHelpers.testBody(schema.postTag.body.fields, request, () => params);
    });

    describe('getActive', () => {
        let group1, group2, group3;
        let params, body;
        beforeEach(async () => {
            group1 = {
                _id: ObjectId(),
                tagGroupName: 'Group 1',
                state: 'active',
                tags: [{ state: 'active' }, { state: 'active' }, { state: 'active' }],
            };
            group2 = {
                _id: ObjectId(),
                tagGroupName: 'Group 2',
                state: 'active',
                tags: [{ state: 'active' }, { state: 'active' }],
            };
            group3 = {
                _id: ObjectId(),
                tagGroupName: 'Group 3',
                state: 'active',
                tags: [{ state: 'active' }],
            };
            await collection.insertOne(group1);

            params = [];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('get', '/tags/active', params, body);

        it('should get active tags', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);

            const tagGroups = response.body;
            expect(tagGroups).toHaveLength(1);
            const tags = tagGroups[0].tags;
            expect(tags).toHaveLength(3);
        });

        it('should get active tags from multiple groups', async () => {
            await collection.insertMany([group2, group3]);
            const response = await request(params, body);

            expect(response.status).toBe(200);

            const tagGroups = response.body;
            expect(tagGroups).toHaveLength(3);
            
            const tagGroup1 = tagGroups.filter(group => group.tagGroupName === 'Group 1')[0];
            const tagGroup2 = tagGroups.filter(group => group.tagGroupName === 'Group 2')[0];
            const tagGroup3 = tagGroups.filter(group => group.tagGroupName === 'Group 3')[0];
            expect(tagGroup1.tags).toHaveLength(3);
            expect(tagGroup2.tags).toHaveLength(2);
            expect(tagGroup3.tags).toHaveLength(1);
        });

        it('should not get archived tags', async () => {
            await integrationHelpers.clearCollection();
            group1.tags = [{ state: 'active' }, { state: 'archived' }, { state: 'active' }];
            await collection.insertOne(group1);

            const response = await request(params, body);

            expect(response.status).toBe(200);

            const tagGroups = response.body;
            expect(tagGroups).toHaveLength(1);
            const tags = tagGroups[0].tags;
            expect(tags).toHaveLength(2);
        });

        it ('should work if there are no active tags', async () => {
            await integrationHelpers.clearCollection();
            group1.tags = [{ state: 'archived' }, { state: 'archived' }];
            group2.tags = [];
            await collection.insertMany([group1, group2]);

            const response = await request(params, body);

            expect(response.status).toBe(200);

            const tagGroups = response.body;
            expect(tagGroups).toHaveLength(2);

            const tagGroup1 = tagGroups.filter(group => group.tagGroupName === 'Group 1')[0];
            const tagGroup2 = tagGroups.filter(group => group.tagGroupName === 'Group 2')[0];
            expect(tagGroup1.tags).toHaveLength(0);
            expect(tagGroup2.tags).toHaveLength(0);
        });
    });

    describe('getArchived', () => {
        let group1, group2, group3;
        let params, body;
        beforeEach(async () => {
            group1 = {
                _id: ObjectId(),
                tagGroupName: 'Group 1',
                state: 'active',
                tags: [{ state: 'archived' }, { state: 'archived' }, { state: 'archived' }],
            };
            group2 = {
                _id: ObjectId(),
                tagGroupName: 'Group 2',
                state: 'active',
                tags: [{ state: 'archived' }, { state: 'archived' }],
            };
            group3 = {
                _id: ObjectId(),
                tagGroupName: 'Group 3',
                state: 'active',
                tags: [{ state: 'archived' }],
            };
            await collection.insertOne(group1);

            params = [];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('get', '/tags/archived', params, body);

        it('should get archived tags', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);

            const tagGroups = response.body;
            expect(tagGroups).toHaveLength(1);
            const tags = tagGroups[0].tags;
            expect(tags).toHaveLength(3);
        });

        it('should get archived tags from multiple groups', async () => {
            await collection.insertMany([group2, group3]);
            const response = await request(params, body);

            expect(response.status).toBe(200);

            const tagGroups = response.body;
            expect(tagGroups).toHaveLength(3);
            
            const tagGroup1 = tagGroups.filter(group => group.tagGroupName === 'Group 1')[0];
            const tagGroup2 = tagGroups.filter(group => group.tagGroupName === 'Group 2')[0];
            const tagGroup3 = tagGroups.filter(group => group.tagGroupName === 'Group 3')[0];
            expect(tagGroup1.tags).toHaveLength(3);
            expect(tagGroup2.tags).toHaveLength(2);
            expect(tagGroup3.tags).toHaveLength(1);
        });

        it('should not get active tags', async () => {
            await integrationHelpers.clearCollection();
            group1.tags = [{ state: 'archived' }, { state: 'active' }, { state: 'archived' }];
            await collection.insertOne(group1);

            const response = await request(params, body);

            expect(response.status).toBe(200);

            const tagGroups = response.body;
            expect(tagGroups).toHaveLength(1);
            const tags = tagGroups[0].tags;
            expect(tags).toHaveLength(2);
        });

        it ('should work if there are no archived tags', async () => {
            await integrationHelpers.clearCollection();
            group1.tags = [{ state: 'active' }, { state: 'active' }];
            group2.tags = [];
            await collection.insertMany([group1, group2]);

            const response = await request(params, body);

            expect(response.status).toBe(200);

            const tagGroups = response.body;
            expect(tagGroups).toHaveLength(2);

            const tagGroup1 = tagGroups.filter(group => group.tagGroupName === 'Group 1')[0];
            const tagGroup2 = tagGroups.filter(group => group.tagGroupName === 'Group 2')[0];
            expect(tagGroup1.tags).toHaveLength(0);
            expect(tagGroup2.tags).toHaveLength(0);
        });
    });

    describe('patchTag', () => {
        let tag, group;
        let params, body;
        beforeEach(async () => {
            tag = {
                tagId: ObjectId(),
                tagName: 'Cool tag',
                tagColor: '#FFFFFF',
                state: 'active',
            };
            group = {
                _id: ObjectId(),
                tagGroupName: 'Cool new tag group',
                sortOrder: 3,
                state: 'active',
                tags: [tag],
            };
            await collection.insertOne(group);

            params = [group._id.toString(), tag.tagId.toString()];
            body = { 
                tagName: 'Updated tag name',
                tagColor: '#000000',
            };
        }); 

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/tags/tag', params, body);

        it('should update tag', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedGroup = await collection.findOne({ _id: group._id });
            const updatedTag = updatedGroup.tags[0];
            expect(updatedTag).toMatchObject({
                tagId: tag.tagId,
                tagName: body.tagName,
                tagColor: body.tagColor,
            });
        });

        it('should update tag in other group', async () => {
            params = [0];
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const updatedGroup = await collection.findOne({ _id: 0 });
            const updatedTag = updatedGroup.tags[0];
            expect(updatedTag).toMatchObject({
                tagId: tag.tagId,
                tagName: body.tagName,
                tagColor: body.tagColor,
            });
        });

        it('should fail with non-existent tag group id', async () => {
            params = [ObjectId().toString(), tag.tagId.toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to update tag');

            const tagGroup = await collection.findOne({ _id: group._id });
            expect(tagGroup).toStrictEqual(group);
        });

        it('should fail with non-existent tag id', async () => {
            params = [group._id.toString(), ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to update tag');

            const tagGroup = await collection.findOne({ _id: group._id });
            expect(tagGroup).toStrictEqual(group);
        });

        integrationHelpers.testParams(schema.patchTag.params.fields, request, () => body, ['tagGroupId', 'tagId']);
        integrationHelpers.testBody(schema.patchTag.body.fields, request, () => params);
    });

    describe('patchTagGroup', () => {
        let tag, group1, group2;
        let params, body;
        beforeEach(async () => {
            tag = {
                tagId: ObjectId(),
                tagName: 'Cool tag',
                tagColor: '#FFFFFF',
            };
            group1 = {
                _id: ObjectId(),
                tagGroupName: 'Group 1',
                tags: [tag],
            };
            group2 = {
                _id: ObjectId(),
                tagGroupName: 'Group 2',
                tags: [],
            };
            await collection.insertMany([group1, group2]);

            params = [group1._id.toString(), tag.tagId.toString()];
            body = { 
                newTagGroupId: group2._id.toString(),
            };
        }); 

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/tags/tag-group', params, body);

        it('should move tag to new group', async () => {
            let oldGroup = await collection.findOne({ _id: group1._id });
            let newGroup = await collection.findOne({ _id: group2._id });
            expect(oldGroup.tags).toHaveLength(1);
            expect(newGroup.tags).toHaveLength(0);

            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            oldGroup = await collection.findOne({ _id: group1._id });
            newGroup = await collection.findOne({ _id: group2._id });
            expect(oldGroup.tags).toHaveLength(0);
            expect(newGroup.tags).toHaveLength(1);
            expect(newGroup.tags[0]).toStrictEqual(tag);
        });

        it('should not affect other tags', async () => {
            await integrationHelpers.clearCollection();
            group1.tags = [tag, { tag: 1 }, { tag: 2 }];
            group2.tags = [{ tag: 1 }, { tag: 2 }];
            await collection.insertMany([group1, group2]);

            let oldGroup = await collection.findOne({ _id: group1._id });
            let newGroup = await collection.findOne({ _id: group2._id });
            expect(oldGroup.tags).toHaveLength(3);
            expect(newGroup.tags).toHaveLength(2);

            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            oldGroup = await collection.findOne({ _id: group1._id });
            newGroup = await collection.findOne({ _id: group2._id });
            expect(oldGroup.tags).toHaveLength(2);
            expect(newGroup.tags).toHaveLength(3);

            const movedTag = newGroup.tags.filter(movedTag => JSON.stringify(movedTag.tagId) === JSON.stringify(tag.tagId))[0];
            expect(movedTag).toStrictEqual(tag);
        });

        it('should move tag to other', async () => {
            let oldGroup = await collection.findOne({ _id: group1._id });
            let newGroup = await collection.findOne({ _id: 0 });
            expect(oldGroup.tags).toHaveLength(1);
            expect(newGroup.tags).toHaveLength(0);

            body.newTagGroupId = 0;
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            oldGroup = await collection.findOne({ _id: group1._id });
            newGroup = await collection.findOne({ _id: 0 });
            expect(oldGroup.tags).toHaveLength(0);
            expect(newGroup.tags).toHaveLength(1);
            expect(newGroup.tags[0]).toStrictEqual(tag);
        });

        it('should move tag from other', async () => {
            await integrationHelpers.clearCollection();
            group1.tags = [];
            await collection.insertMany([group1, {
                _id: 0,
                tagGroupName: 'Other',
                tags: [tag],
            }]);

            let oldGroup = await collection.findOne({ _id: 0 });
            let newGroup = await collection.findOne({ _id: group1._id });
            expect(oldGroup.tags).toHaveLength(1);
            expect(newGroup.tags).toHaveLength(0);

            params = [0, tag.tagId.toString()];
            body.newTagGroupId = group1._id.toString();
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            oldGroup = await collection.findOne({ _id: 0 });
            newGroup = await collection.findOne({ _id: group1._id });
            expect(oldGroup.tags).toHaveLength(0);
            expect(newGroup.tags).toHaveLength(1);
            expect(newGroup.tags[0]).toStrictEqual(tag);
        });

        it('should fail with non-existent tag id', async () => {
            params = [group1._id.toString(), ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to retrieve tag from database');
        });

        it('should fail with non-existent tag group id', async () => {
            params = [ObjectId().toString(), tag.tagId.toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to retrieve tag from database');
        });

        it('should fail with non-existent new tag group id', async () => {
            body.newTagGroupId = ObjectId().toString();
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('update of tag group failed: tag not added to new tag group');
        });

        integrationHelpers.testParams(schema.patchTagGroup.params.fields, request, () => body, ['tagGroupId', 'tagId']);
        integrationHelpers.testBody(schema.patchTagGroup.body.fields, request, () => params);
    });

    describe('archiveTag', () => {
        let params, body;
        let group, tag;
        beforeEach(async () => {
            tag = {
                tagId: ObjectId(),
                tagName: 'Tag to archive',
                tagColor: '#FFFFFF',
                state: 'active',
            };
            group = {
                _id: ObjectId(),
                tagGroupName: 'Cool new tag group',
                tags: [tag],
            };
            await collection.insertOne(group);

            params = [group._id.toString(), tag.tagId.toString()];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/tags/archive-tag', params, body);

        it('should archive tag', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const tagGroup = await collection.findOne({ _id: group._id });
            expect(tagGroup.tags).toHaveLength(1);
            const archivedTag = tagGroup.tags[0];
            expect(archivedTag.state).toBe('archived');
        });

        it('should archive tag in other', async () => {
            await integrationHelpers.clearCollection();
            await collection.insertOne({
                _id: 0,
                tagGroupName: 'Other',
                tags: [tag],
            });
            params = [0, tag.tagId.toString()];
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const tagGroup = await collection.findOne({ _id: 0 });
            expect(tagGroup.tags).toHaveLength(1);
            const archivedTag = tagGroup.tags[0];
            expect(archivedTag.state).toBe('archived');
        });

        it('should archive tag but not other tags in group', async () => {
            await integrationHelpers.clearCollection();
            group.tags = [tag, { tag: 1, state: 'active' }, { tag: 2, state: 'active' }];
            await collection.insertOne(group);

            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const tagGroup = await collection.findOne({ _id: group._id });
            expect(tagGroup.tags).toHaveLength(3);

            const archivedTags = tagGroup.tags.filter(tagToCheck => tagToCheck.state === 'archived');
            expect(archivedTags).toHaveLength(1);
            expect(archivedTags[0].tagId).toStrictEqual(tag.tagId);
        });

        it('should fail with nonexistent tag', async () => {
            params = [group._id.toString(), ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('archive failed: tag not archived');
        });

        it('should fail with nonexistent tag group', async () => {
            params = [ObjectId().toString(), tag.tagId.toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('archive failed: tag not archived');
        });

        integrationHelpers.testParams(schema.archiveTag.params.fields, request, () => body, ['tagGroupId', 'tagId']);
    });

    describe('recoverTag', () => {
        let params, body;
        let group, tag;
        beforeEach(async () => {
            tag = {
                tagId: ObjectId(),
                tagName: 'Tag to recover',
                tagColor: '#FFFFFF',
                state: 'archived',
            };
            group = {
                _id: ObjectId(),
                tagGroupName: 'Cool new tag group',
                tags: [tag],
            };
            await collection.insertOne(group);

            params = [group._id.toString(), tag.tagId.toString()];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('patch', '/tags/recover-tag', params, body);

        it('should recover tag', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const tagGroup = await collection.findOne({ _id: group._id });
            expect(tagGroup.tags).toHaveLength(1);
            const archivedTag = tagGroup.tags[0];
            expect(archivedTag.state).toBe('active');
        });

        it('should recover tag in other', async () => {
            await integrationHelpers.clearCollection();
            await collection.insertOne({
                _id: 0,
                tagGroupName: 'Other',
                tags: [tag],
            });
            params = [0, tag.tagId.toString()];
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const tagGroup = await collection.findOne({ _id: 0 });
            expect(tagGroup.tags).toHaveLength(1);
            const archivedTag = tagGroup.tags[0];
            expect(archivedTag.state).toBe('active');
        });

        it('should recover tag but not other tags in group', async () => {
            await integrationHelpers.clearCollection();
            group.tags = [tag, { tag: 1, state: 'archived' }, { tag: 2, state: 'archived' }];
            await collection.insertOne(group);

            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const tagGroup = await collection.findOne({ _id: group._id });
            expect(tagGroup.tags).toHaveLength(3);

            const archivedTags = tagGroup.tags.filter(tagToCheck => tagToCheck.state === 'active');
            expect(archivedTags).toHaveLength(1);
            expect(archivedTags[0].tagId).toStrictEqual(tag.tagId);
        });

        it('should fail with nonexistent tag', async () => {
            params = [group._id.toString(), ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('recover failed: tag not recovered');
        });

        it('should fail with nonexistent tag group', async () => {
            params = [ObjectId().toString(), tag.tagId.toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('recover failed: tag not recovered');
        });

        integrationHelpers.testParams(schema.recoverTag.params.fields, request, () => body, ['tagGroupId', 'tagId']);
    });

    describe('deleteTag', () => {
        let params, body;
        let group, tag;
        beforeEach(async () => {
            tag = {
                tagId: ObjectId(),
                tagName: 'Tag to delete',
                tagColor: '#FFFFFF',
                state: 'active',
            };
            group = {
                _id: ObjectId(),
                tagGroupName: 'Cool new tag group',
                tags: [tag],
            };
            await collection.insertOne(group);

            params = [group._id.toString(), tag.tagId.toString()];
            body = {};
        });

        const request = (params, body) => integrationHelpers.executeRequest('delete', '/tags/tag', params, body);

        it('should delete tag', async () => {
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const tagGroup = await collection.findOne({ _id: group._id });
            expect(tagGroup.tags).toHaveLength(0);
        });

        it('should delete tag in other', async () => {
            await integrationHelpers.clearCollection();
            await collection.insertOne({
                _id: 0,
                tagGroupName: 'Other',
                tags: [tag],
            });
            params = [0, tag.tagId.toString()];
            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const tagGroup = await collection.findOne({ _id: 0 });
            expect(tagGroup.tags).toHaveLength(0);
        });

        it('should delete tag but not other tags in group', async () => {
            await integrationHelpers.clearCollection();
            group.tags = [tag, { tag: 1, state: 'active' }, { tag: 2, state: 'active' }];
            await collection.insertOne(group);

            const response = await request(params, body);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Success!');

            const tagGroup = await collection.findOne({ _id: group._id });
            expect(tagGroup.tags).toBeFalsy();

            const deletedTag = tagGroup.tags.filter(tagToCheck => JSON.stringify(tagToCheck.tagId) === JSON.stringify(tag.tagId));
            expect(deletedTag).toHaveLength(0);
        });

        it('should fail with nonexistent tag', async () => {
            params = [group._id.toString(), ObjectId().toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('deletion failed: tag not deleted');
        });

        it('should fail with nonexistent tag group', async () => {
            params = [ObjectId().toString(), tag.tagId.toString()];
            const response = await request(params, body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('deletion failed: tag not deleted');
        });

        integrationHelpers.testParams(schema.deleteTag.params.fields, request, () => body, ['tagGroupId', 'tagId']);
    });
});
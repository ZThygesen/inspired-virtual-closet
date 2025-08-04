import { ObjectId } from 'mongodb';
import { testHelpers } from '../helpers';
import { schemaHelpers } from '../../schema/helpers';

describe('tags', () => {
    let user, client, db, collection, clientCollection;
    beforeAll(async () => { await testHelpers.beforeAll('tags'); });
    afterAll(async () => { await testHelpers.afterAll(); });
    beforeEach(async () => { 
        await testHelpers.beforeEach();
        ({ user, client, db, collection, clientCollection } = testHelpers);
    });
    afterEach(async () => { await testHelpers.afterEach(); });

    describe('postGroup', () => {
        let body;
        beforeEach(() => {
            body = { tagGroupName: 'Cool new tag group' };
        });

        it('should create new tag group', async () => {
            const response = await testHelpers.agent().post('/tags/group').send(body);
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            const tagGroup = await collection.findOne({ tagGroupName: body.tagGroupName });
            expect(ObjectId.isValid(tagGroup._id)).toBe(true);
            expect(tagGroup).toMatchObject({
                tagGroupName: body.tagGroupName,
                sortOrder: 0,
                state: 'active',
                tags: [],
            });
        });

        it('should create new tag group with sort order 1', async () => {
            await collection.insertOne({ tagGroupName: 'First tag group' });
            const response = await testHelpers.agent().post('/tags/group').send(body);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Success!');
            const tagGroup = await collection.findOne({ tagGroupName: body.tagGroupName });
            expect(tagGroup.sortOrder).toBe(1);
        });

        it('should fail if tag group name already exists', async () => {
            await collection.insertOne({ tagGroupName: body.tagGroupName });
            const response = await testHelpers.agent().post('/tags/group').send(body);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a tag group named "${body.tagGroupName}" already exists`);
        });

        const invalidData = schemaHelpers.generateInvalidStringData('tagGroupName');
        invalidData.forEach((invalid) => {
            it(`should fail with invalid tag group name: ${JSON.stringify(invalid)}`, async () => {
                const response = await testHelpers.agent().post('/tags/group').send(invalid);

                expect(response.status).toBe(400);
                expect(response.body.message).toMatch(/tagGroupName/);
            });
        });
    });

    describe('patchGroup', () => {
        let data, body;
        beforeEach(async () => {
            data = {
                _id: ObjectId(),
                tagGroupName: 'Cool new tag group',
                sortOrder: 3,
                state: 'active',
                tags: [],
            };
            await collection.insertOne(data);
            body = { tagGroupName: 'Updated tag group name' };
        });

        it('should update tag group', async () => {
            const response = await testHelpers.agent().patch(`/tags/group/${data._id.toString()}`).send(body);

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
            const response = await testHelpers.agent().patch(`/tags/group/${data._id.toString()}`).send(body);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe(`a tag group named "${body.tagGroupName}" already exists`);

            const tagGroup = await collection.findOne({ _id: data._id });
            expect(tagGroup).toStrictEqual(data);
        });

        it('should fail with non-existent tag group id', async () => {
            const response = await testHelpers.agent().patch(`/tags/group/${ObjectId().toString()}`).send(body);

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('failed to update tag group');

            const tagGroup = await collection.findOne({ _id: data._id });
            expect(tagGroup).toStrictEqual(data);
        });

        const invalidParamsData = schemaHelpers.generateInvalidIdDataNoOther('tagGroupId');
        invalidParamsData.forEach((invalid) => {
            it(`should fail with invalid tag group id: ${JSON.stringify(invalid)}`, async () => {
                const response = await testHelpers.agent().patch(`/tags/group/${invalid.tagGroupId}`).send(body);

                expect(response.status).toBe(400);
                expect(response.body.message).toMatch(/tagGroupId/);
            });
        });

        const invalidBodyData = schemaHelpers.generateInvalidStringData('tagGroupName');
        invalidBodyData.forEach((invalid) => {
            it(`should fail with invalid tag group name: ${JSON.stringify(invalid)}`, async () => {
                const response = await testHelpers.agent().patch(`/tags/group/${data._id.toString()}`).send(invalid);

                expect(response.status).toBe(400);
                expect(response.body.message).toMatch(/tagGroupName/);
            });
        });
    });

    // describe('get tag group', () => {
    //     let data;
    //     beforeEach(() => {
    //         data = { tagGroupName: 'Cool new tag group' };
    //     });

    //     it('should create new tag group', async () => {
    //         const response = await agent(app).post('/tags/group').send(data);

    //         expect(response.status).toBe(201);
    //         expect(response.body.message).toBe('Success!');
    //         const tagGroup = await collection.findOne({ tagGroupName: data.tagGroupName });
    //         expect(ObjectId.isValid(tagGroup._id)).toBe(true);
    //         expect(tagGroup).toMatchObject({
    //             tagGroupName: data.tagGroupName,
    //             sortOrder: 0,
    //             state: 'active',
    //             tags: [],
    //         });
    //     });

    //     it('should create new tag group with sort order 1', async () => {
    //         await collection.insertOne({ tagGroupName: 'First tag group' });
    //         const response = await agent(app).post('/tags/group').send(data);

    //         expect(response.status).toBe(201);
    //         expect(response.body.message).toBe('Success!');
    //         const tagGroup = await collection.findOne({ tagGroupName: data.tagGroupName });
    //         expect(tagGroup.sortOrder).toBe(1);
    //     });

    //     it('should fail if tag group name already exists', async () => {
    //         await collection.insertOne({ tagGroupName: data.tagGroupName });

    //         const response = await agent(app).post('/tags/group').send(data);
    //         expect(response.status).toBe(400);
    //         expect(response.body.message).toBe(`a tag group named "${data.tagGroupName}" already exists`);
    //     });

    //     const invalidData = [
    //         { tagGroupName: '' },
    //         { tagGroupName: '   ' },
    //         { tagGroupName: null },
    //         { tagGroupName: undefined },
    //         { tagGroupName: 123 },
    //         { tagGroupName: true },
    //         { tagGroupName: false },
    //         { tagGroupName: [] },
    //         { tagGroupName: {} },
    //     ];
    //     invalidData.forEach((invalid) => {
    //         it(`should fail with invalid tag group name: ${JSON.stringify(invalid)}`, async () => {
    //             const response = await agent(app).post('/tags/group').send(invalid);

    //             expect(response.status).toBe(400);
    //             expect(response.body.message).toMatch(/tagGroupName/);
    //         });
    //     });
    // });
});
import { schemaHelpers } from '../../schema/helpers';
import { schema } from '../../schema/tags.schema';
import { ObjectId } from 'mongodb';

describe('tags', () => {
    describe('postGroup', () => {
        it('should validate', () => {
            const { error } = schema.postGroupBody.validate({ tagGroupName: 'Cool new tag group' });
            expect(error).toBeUndefined();
        });

        const invalidData = schemaHelpers.generateInvalidStringData('tagGroupName');
        invalidData.forEach((invalid) => {
            it(`should fail with invalid tag group name: ${JSON.stringify(invalid)}`, () => {
                const { error } = schema.postGroupBody.validate(invalid);
                expect(error).toBeDefined();
                expect(error.details[0].message).toMatch(/tagGroupName/);
            });
        });
    });

    describe('patchGroup', () => {
        describe('params', () => {
            it('should validate', () => {
                const { error } = schema.patchGroupParams.validate({ tagGroupId: ObjectId().toString() });
                expect(error).toBeUndefined();
            });
            it('should fail if other category', () => {
                const { error } = schema.patchGroupParams.validate({ tagGroupId: '0' });
                expect(error).toBeDefined();
                expect(error.details[0].context.message).toBe('cannot be "Other" category');
            });
            it('should fail with invalid tag group id', () => {
                const { error } = schema.patchGroupParams.validate({ tagGroupId: 'invalid-id' });
                expect(error).toBeDefined();
                console.log(error)
                expect(error.details[0].context.message).toBe('invalid mongodb object id');
            });

            const invalidData = schemaHelpers.generateInvalidStringData('tagGroupId');
            invalidData.forEach((invalid) => {
                it(`should fail with invalid tag group id: ${JSON.stringify(invalid)}`, () => {
                    const { error } = schema.patchGroupParams.validate(invalid);
                    expect(error).toBeDefined();
                    expect(error.details[0].message).toMatch(/tagGroupId/);
                });
            });
        });
        describe('body', () => {
            it('should validate', () => {
                const { error } = schema.patchGroupBody.validate({ tagGroupName: 'Cool new tag group' });
                expect(error).toBeUndefined();
            });

            const invalidData = schemaHelpers.generateInvalidStringData('tagGroupName');
            invalidData.forEach((invalid) => {
                it(`should fail with invalid tag group name: ${JSON.stringify(invalid)}`, () => {
                    const { error } = schema.patchGroupBody.validate(invalid);
                    expect(error).toBeDefined();
                    expect(error.details[0].message).toMatch(/tagGroupName/);
                });
            });
        });
    });

    describe('patchGroupOrder', () => {
        it('should validate', () => {
            const { error } = schema.patchGroupOrderBody.validate({ 
                tagGroups: [
                    { _id: ObjectId().toString() },
                    { _id: '0' },
                    { _id: ObjectId().toString() },
                    { _id: 0 },
                    { _id: ObjectId().toString() },
                ]
            });
            expect(error).toBeUndefined();
        });
        it('should validate (only one item)', () => {
            const { error } = schema.patchGroupOrderBody.validate({ 
                tagGroups: [
                    { _id: ObjectId().toString() },
                ]
            });
            expect(error).toBeUndefined();
        });

        const invalidData = [
            { tagGroups: [{ _id: 'invalid_id' }] },
            { tagGroups: [{ _id: ObjectId().toString() }, { _id: 'invalid_id' }] },
            { tagGroups: [] },
            { tagGroups: [{}] },
            { tagGroups: [{ _id: '' }] },
            { tagGroups: [{ _id: ' ' }] },
            { tagGroups: [{ _id: null }] },
            { tagGroups: [{ _id: undefined }] },
            { tagGroups: [{ _id: 123 }] },
            { tagGroups: [{ _id: true }] },
            { tagGroups: [{ _id: false }] },
            { tagGroups: [{ _id: [] }] },
            { tagGroups: [{ _id: {} }] },
            {},
        ];
        invalidData.forEach((invalid) => {
            it(`should fail with invalid tag groups: ${JSON.stringify(invalid)}`, () => {
                const { error } = schema.patchGroupOrderBody.validate(invalid);
                expect(error).toBeDefined();
                expect(error.details[0].message).toMatch(/tagGroups/);
            });
        });
    });

    describe('deleteGroup', () => {
        it('should validate', () => {
            const { error } = schema.deleteGroupParams.validate({ tagGroupId: ObjectId().toString() });
            expect(error).toBeUndefined();
        });
        it('should fail if other category', () => {
            const { error } = schema.deleteGroupParams.validate({ tagGroupId: '0' });
            expect(error).toBeDefined();
            expect(error.details[0].context.message).toBe('cannot be "Other" category');
        });
        it('should fail with invalid tag group id', () => {
            const { error } = schema.deleteGroupParams.validate({ tagGroupId: 'invalid-id' });
            expect(error).toBeDefined();
            console.log(error)
            expect(error.details[0].context.message).toBe('invalid mongodb object id');
        });

        const invalidData = schemaHelpers.generateInvalidStringData('tagGroupId');
        invalidData.forEach((invalid) => {
            it(`should fail with invalid tag group id: ${JSON.stringify(invalid)}`, () => {
                const { error } = schema.deleteGroupParams.validate(invalid);
                expect(error).toBeDefined();
                expect(error.details[0].message).toMatch(/tagGroupId/);
            });
        });
    });
});
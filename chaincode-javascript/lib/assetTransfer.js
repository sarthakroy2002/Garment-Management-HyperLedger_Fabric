'use strict';

const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class GarmentTransfer extends Contract {

    async InitLedger(ctx) {
        const garments = [
            {
                ID: 'garment1',
                Color: 'blue',
                Size: 5,
                Owner: 'A',
                AppraisedValue: 300,
            },
            {
                ID: 'garment2',
                Color: 'red',
                Size: 5,
                Owner: 'B',
                AppraisedValue: 400,
            },
            {
                ID: 'garment3',
                Color: 'green',
                Size: 10,
                Owner: 'A',
                AppraisedValue: 500,
            },
            {
                ID: 'garment4',
                Color: 'yellow',
                Size: 10,
                Owner: 'C',
                AppraisedValue: 600,
            },
            {
                ID: 'garment5',
                Color: 'black',
                Size: 15,
                Owner: 'A',
                AppraisedValue: 700,
            },
            {
                ID: 'garment6',
                Color: 'white',
                Size: 15,
                Owner: 'D',
                AppraisedValue: 800,
            },
        ];

        for (const garment of garments) {
            garment.docType = 'garment';
            await ctx.stub.putState(garment.ID, Buffer.from(stringify(sortKeysRecursive(garment))));
        }
    }

    async CreateGarment(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.GarmentExists(ctx, id);
        if (exists) {
            throw new Error(`The garment ${id} already exists`);
        }

        const garment = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(garment))));
        return JSON.stringify(garment);
    }

    async ReadGarment(ctx, id) {
        const garmentJSON = await ctx.stub.getState(id);
        if (!garmentJSON || garmentJSON.length === 0) {
            throw new Error(`The garment ${id} does not exist`);
        }
        return garmentJSON.toString();
    }

    async UpdateGarment(ctx, id, color, size, owner, appraisedValue) {
        const exists = await this.GarmentExists(ctx, id);
        if (!exists) {
            throw new Error(`The garment ${id} does not exist`);
        }

        const updatedGarment = {
            ID: id,
            Color: color,
            Size: size,
            Owner: owner,
            AppraisedValue: appraisedValue,
        };
        return ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(updatedGarment))));
    }

    async DeleteGarment(ctx, id) {
        const exists = await this.GarmentExists(ctx, id);
        if (!exists) {
            throw new Error(`The garment ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    async GarmentExists(ctx, id) {
        const garmentJSON = await ctx.stub.getState(id);
        return garmentJSON && garmentJSON.length > 0;
    }

    async TransferGarment(ctx, id, newOwner) {
        const garmentString = await this.ReadGarment(ctx, id);
        const garment = JSON.parse(garmentString);
        const oldOwner = garment.Owner;
        garment.Owner = newOwner;
        await ctx.stub.putState(id, Buffer.from(stringify(sortKeysRecursive(garment))));
        return oldOwner;
    }

    async GetAllGarments(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = GarmentTransfer;

const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    subscribedToChannel: {
        type: String,
        required: true
    },
    subscribeDate: {
        type: Date,
        required: true,
        default: Date.now
    }
});

module.exports = mongoose.model('Subscriber', subscriberSchema);


const clients = [
    {
        _id: 'thisIsAnId',
        name: 'clientName',
        clothes: [
            {
                item_type: 'typeOfClothing',
                item_name: 'nameOfClothing',
                item_img: 'urlOfClothing'
            },
        ]
    },
]

const clothingTypes = [
    {
        
    }
]

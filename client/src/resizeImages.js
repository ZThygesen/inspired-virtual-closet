import Resizer from 'react-image-file-resizer';

export const resizeImages = async (categories) => {
    for (const category of categories) {
        for (const item of category.items) {
            const file = await fetch(item.fullFileUrl).then(res => res.blob());
            item.smallFileUrl = await resizeImage(file, 300);
        }
    }
}

function resizeImage(file, size) {
    return new Promise((resolve) => {
        Resizer.imageFileResizer(
            file,
            size,
            size,
            'PNG',
            100,
            0,
            (uri) => {
                resolve(uri);
            },
            'base64'
        );
    });
}
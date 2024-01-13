import Resizer from 'react-image-file-resizer';

function getImageSize(file) {
    return new Promise(function (resolve, reject) {
        const i = new Image();
        i.onload = function() {
            if (i.width < 1000 && i.height < 1000) {
                resolve({ w: i.width, h: i.height });
            } else {
                resolve({ w: 1000, h: 1000 })
            }
        };
        i.src = file;
    });
}

export async function resizeImage(file, type) {
    const { w, h } = await getImageSize(file);
    const blob = await fetch(file).then(res => res.blob());
    return new Promise((resolve) => {
        Resizer.imageFileResizer(
            blob,
            w,
            h,
            type,
            100,
            0,
            (uri) => {
                resolve(uri);
            },
            'base64'
        );
    });
}
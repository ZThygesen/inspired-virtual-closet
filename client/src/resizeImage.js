import Resizer from 'react-image-file-resizer';

function getImageSize(file) {
    return new Promise(function (resolve, reject) {
        const image = new Image();
        image.onload = function() {
            if (image.width < 1000 && image.height < 1000) {
                resolve({ w: image.width, h: image.height });
            } else {
                resolve({ w: 1000, h: 1000 })
            }
        };

        image.onerror = function(err) {
            reject(err);
        }

        image.src = file;
    });
}

export async function resizeImage(file, type) {
    try {
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
    } catch (err) {
        return Promise.reject(err);
    }
    
}
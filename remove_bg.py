from cv2 import imread, merge, split, imwrite, THRESH_OTSU, threshold, bitwise_and, THRESH_BINARY, COLOR_BGR2RGB, IMWRITE_PNG_COMPRESSION, THRESH_BINARY_INV, imdecode, imencode, IMREAD_UNCHANGED, cvtColor, COLOR_BGR2GRAY
from PIL import Image, ImageOps
from rembg import remove
import sys

def remove_bg(input_path, output_path):
    img = imread('temp_uncprocessed_imgs/clr15oo8j005c356d04xhef8b.jpeg')

    # _, alpha = threshold(cvtColor(img, COLOR_BGR2GRAY), 0, 255, THRESH_BINARY | THRESH_OTSU)

    # b, g, r = split(img)
    # rgba = [b, g, r, alpha]
    # dst = merge(rgba, 4)
    output = remove(img)
    imwrite('temp_processed_imgs/test.png', output)
    print('yay')

if __name__ == '__main__':
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    remove_bg(input_path, output_path)
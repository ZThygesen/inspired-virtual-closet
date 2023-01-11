import styled from 'styled-components';
import Dropzone from './Dropzone';

const CategorySelect = styled.div`

`;

export default function AddClothes({ category }) {
    return (
        <>
            <CategorySelect>
                <p>{category}</p>
            </CategorySelect>
            <Dropzone />
        </>
    );
}

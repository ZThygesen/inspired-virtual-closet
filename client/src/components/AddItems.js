import styled from 'styled-components';
import Dropzone from './Dropzone';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
`;

const CategorySelect = styled.div`
    max-width: 800px;

    .first, .second {
        color: var(--black);
        font-weight: bold;
        text-align: center;
        margin-bottom: 20px;
    }

    .first {
        font-size: 32px;
    }

    .second {
        font-size: 22px;
    }

    .category {
        color: var(--secondary);
        text-decoration: underline;
        cursor: pointer;
    }
`;

export default function AddItems({ display, openSidebar, category }) {
    return (
        <Container style={{ display: display ? 'flex' : 'none' }}>
            <CategorySelect>
                <p className="first">Add items to <span className="category" onClick={openSidebar}>{category.toUpperCase()}</span></p>
                <p className="second">(Select the category you want to add items to from the sidebar)</p>
            </CategorySelect>
            <Dropzone category={category} />
        </Container>
    );
}

import styled from 'styled-components';
import Dropzone from './Dropzone';
import NoCategories from './NoCategories';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
`;

const CategorySelect = styled.div`
    max-width: 800px;
    text-align: center;

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
    
    .error {
        color: red;
    }

    .error.category {
        color: red;
    }
`;

export default function AddItems({ display, openSidebar, category }) {
    return (
        <Container style={{ display: display ? 'flex' : 'none' }}>
            <CategorySelect>
                {
                    category.name === undefined ?
                        <>
                            <NoCategories fontSize={32} />
                        </>
                        :
                        category._id === -1 ?
                            <>
                                <p className="first error">Cannot add items to <span className="category error" onClick={openSidebar}>{category.name?.toUpperCase()}</span></p> 
                                <p className="second">(Select a specific category you want to add items to)</p>
                            </>
                            :
                            <>
                                <p className="first">Add items to <span className="category" onClick={openSidebar}>{category.name?.toUpperCase()}</span></p>
                                <p className="second">(Select the category you want to add items to from the sidebar)</p>
                            </>
                }
            </CategorySelect>
            <Dropzone category={category.name} disabled={category._id === -1} />
        </Container>
    );
}

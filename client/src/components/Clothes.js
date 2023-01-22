import cuid from 'cuid';
import styled from 'styled-components';
import ClothingCard from './ClothingCard';
import NoCategories from './NoCategories';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    text-align: center;

    .category-title {
        font-size: 50px;
        margin-bottom: 10px;
    }

    .items {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 30px;
    }
`;

export default function Clothes({ display, category, clothes }) {
    return (
        <Container style={{ display: display ? 'flex' : 'none' }}>
            {
                category.name === undefined ? <NoCategories fontSize={28} /> :
                    <>
                        <p className="category-title">{category.name}</p>
                        <div className="items">
                            {
                                clothes.map(item => (
                                    <ClothingCard item={item} key={cuid()} />
                                ))
                            }
                        </div>
                    </>
            }
        </Container>
        
    );
}

import Dropzone from './Dropzone';
import { AddItemsContainer } from '../styles/AddItems';

export default function AddItems({ display, client, category, openSidebar, updateItems }) {
    return (
        <AddItemsContainer style={{ display: display ? 'flex' : 'none' }}>
            <div className="category-select">
                {
                    /* category.name === undefined ?
                        <>
                            <NoCategories fontSize={32} />
                        </>
                        : */
                        (category._id === -1/*  || category._id === 0 */) ?
                            <>
                                <h2 className="add-item-title error">Cannot add items to <span className="category error" onClick={openSidebar}>{category.name}</span></h2> 
                                <p className="help-info">(select a specific category you want to add items to)</p>
                            </>
                            :
                            <>
                                <h2 className="add-item-title">Add items to <span className="category" onClick={openSidebar}>{category.name}</span></h2>
                                <p className="help-info">(select the category you want to add items to from the sidebar)</p>
                            </>
                }
            </div>
            <Dropzone client={client} category={category} disabled={category._id === -1 || category._id === 0} updateItems={updateItems} />
        </AddItemsContainer>
    );
}

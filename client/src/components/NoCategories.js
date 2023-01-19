export default function NoCategories({ fontSize }) {
    return (
        <p
            style={{
                fontSize: `${fontSize}px` || '22px',
                fontFamily: 'Fashion',
                padding: '10px'
            }}
        >
            There are no categories. Add some by clicking "ADD CATEGORY" in the category sidebar.
        </p>
    );
}


import React, { useEffect, useState } from "react"
// import allProducts from "../../../Apollo/queries/allProducts"
import './TextCRUD.css'
import FormCRUD from "./FormCRUD"
import { borderRadius } from "react-select/src/theme";

// import UPDATE_CATEGORY from "../Apollo/mutations/updateCategory"

function TextCRUD({ img, name, stock, categories, price, id }) {
  const [show, setShow] = useState(true);

  //harcodeo pa que aparezca algo... 
  // categories = [{id: 1, name:"postres "},{id: 2, name:"masas finas "} ]
  // stock = 10
  //fin del hardcodeo.........
  function handlerOnClick() {
    setShow(!show);
    // console.log("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", show);
  }

  console.log('me rendericé')

  return (
    <div className="product-container-edit" onDoubleClick={handlerOnClick}>
      {show ? (
        <div className="element-container" id={id}>
          <div className="info-container">
          <div className="image-container">
            <p>Product</p>
            <div className="img-circle" style={{backgroundImage: `url(${img})`, width: "80px", height: "80px",borderRadius: '50%',backgroundSize: "fill", backgroundColor: "#eeeeee00"}}/>
            {/* <img src={img} alt="" /> */}
          </div>
          <div className="name-container">
            <p>Name</p>
            <p>{name}</p>
          </div>
          <div className="stock-container">
            <p>Stock</p>
            {stock}
          </div>
          <div className="category-container">
            <p>Categories</p>
            {categories.map((element) => (
              <span key={element.id}>{element.name}</span>
            ))}
          </div>
          <div className="price-container">
            <p>Price</p>
            <p>{price} </p>
          </div>
          <div className="edit-button">
            <p>edit</p>
          </div>
          <div className="remove-button">
            <p>remove</p>
          </div>
          </div>
        </div>
      ) : (
        <FormCRUD
          id={id}
          key={id}
          img={img}
          name={name}
          stock={stock}
          categories={categories}
          price={price}
          handlerOnClick={handlerOnClick}
        />
      )}
    </div>
  );
}

export default TextCRUD;

import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Route } from "react-router-dom";

//styles
import styled from "styled-components";

//components
import LeftPanel from "../LeftPanel";
import AdminNavBar from "../AdminNavBar";
// import TextCRUD from '../TextCRUD'
import ListCRUD from "../ListCRUD";
import AddProductForm from "../../../AddProductForm";
import TablaOrdenes from "../../admin/ordenes/TablaOrdenes";
import UserAdmin from "../ordenes/UserAdmin";
import Pagination from "../ordenes/Pagination";
import CheckFilters from "../ordenes/CheckFilters";
import ManageStores from "../stores/ManageStores";
import StoreOptions from "../stores/StoreOptions";
import StorePanel from "../stores/StoresPanel";
import ModifyStore from "../stores/ModifyStore";

const AdminPanel = () => {
  const [addProduct, setAddProduct] = useState(false);
  let { status } = useSelector((state) => state.theme);
  const [stores, setStores] = useState("seeStores");
  return (
    <StyledAdminPanel light={status}>
      <div className="left">
        <LeftPanel />
      </div>
      <div className="right">
        <div className="top">
          <AdminNavBar setAddProduct={setAddProduct} />
          <Route
            path="/admin/stores"
            component={() => StoreOptions({ setStores })}
          />
          <Route path="/admin/orders" component={CheckFilters} />
        </div>
       
        <div className="bottom">
          <Route path="/admin/products" component={ListCRUD} />
          <Route path="/admin/orders" component={TablaOrdenes} />
          <Route path="/admin/users" component={UserAdmin} />
          {stores === "seeStores" ? (
            <Route path="/admin/stores" component={StorePanel} />
          ) : stores === "modifyStore" ? (
            <Route path="/admin/stores" component={ModifyStore} />
          ) : stores === "addStore" ? (
            <Route path="/admin/stores" component={ManageStores} />
          ) : (
            <p></p>
          )}
        </div>
        <Route path="/admin/orders">
          <Pagination />
        </Route>
        <Route path="/admin/add-product">
          <AddProductForm />
        </Route>
      </div>
    </StyledAdminPanel>
  );
};

const StyledAdminPanel = styled.div`
  min-height: 100vh;
    height: fit-content;
    width: 100%;
    display:flex;
    flex-direction:row;
    justify-content:space-between;
    background:${({light})=>light 
    ? '#F1F1F1' 
    : '#222222'};
    color:${({light})=>light 
    ? 'inherit' 
    : 'white'};
    .left{
        width:13%;
        z-index: 10;
    }
    .right{
        width:87%;
        display:flex;
        flex-direction:column;
        height: fit-content;
        .top{
            position: sticky;
            z-index: 2;
            width: 100%;
            top: 0;
            padding-left: 4rem;
            padding-right: 4rem;
            background: #f1f1f1
            
        }
        .bottom{
            position: relative;
            //background: black;
            height:fit-content;
            width: 100%;
            display:flex;
            flex-direction: column;
            justify-content:center;
            align-items:center;
            z-index: 1;
            padding: 0 4rem;
        }
        .edit-grid{
            position: absolute;
            z-index: 3;
            background: #eeeeee00;
            top: 12vh;
            width: 85vw;
        }}`;

export default AdminPanel;

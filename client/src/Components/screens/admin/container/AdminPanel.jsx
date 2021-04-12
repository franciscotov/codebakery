import React from 'react'

//styles
import styled from 'styled-components';

//components
import LeftPanel from '../LeftPanel';
import AdminNavBar from '../AdminNavBar';
// import TextCRUD from '../TextCRUD'
import ListCRUD from "../ListCRUD"
import AddProductForm from '../../../AddProductForm';

const AdminPanel = () => {
   
    return (
        <StyledAdminPanel>
            <div className="left">
                <LeftPanel/>
            </div>
            <div className="right">
                <div className="top">
                <AdminNavBar/>
                </div>
                <div className="bottom">
                    <AddProductForm/>
                </div>
                <ListCRUD/>
                {/* <FormCRUD /> */}
            </div>
            
        </StyledAdminPanel>
        
    )
}

const StyledAdminPanel = styled.div`
    min-height: 100vh;
    width: 100%;
    display:flex;
<<<<<<< HEAD
    max-width: 100vw;
=======
    flex-direction:row;
    justify-content:space-between;
    background: black;
    .left{
        width:13%;
        //background:green;
    }
    .right{
        width:87%;
        //background:yellow;
        display:flex;
        flex-direction:column;
        .top{
            height:15vh;
        }
        .bottom{
            height:85vh;
            display:flex;
            justify-content:center;
            align-items:center;
        }
    }
>>>>>>> ea17e28fde9c2a907425c861ece2d074b16cab93
`;

export default AdminPanel

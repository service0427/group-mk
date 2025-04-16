import { Container, useMenuCurrentItem } from "@/components";
import { PageMenu } from "@/pages/public-profile";
import { Navbar } from "@/partials/navbar";
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from "@/partials/toolbar";
import { useMenus } from "@/providers";
import { useLocation } from "react-router";
import { Fragment } from "react/jsx-runtime";
import ManageUsersContent from "./ManageUsersContent";



const ManageUsersPage = () => {
    const { pathname }= useLocation();
    const { getMenuConfig } = useMenus();
    const menuConfig = getMenuConfig('parimary');
    const menuItem = useMenuCurrentItem(pathname, menuConfig);
    

    return (
    <Fragment>
        <Container>
            <Navbar>
                <PageMenu />
            </Navbar>
            <Toolbar>
                <ToolbarHeading>
                    <ToolbarPageTitle />
                    <ToolbarDescription>
                        {menuItem?.title || '회원관리'} 페이지
                    </ToolbarDescription>

                </ToolbarHeading>
            </Toolbar>
        </Container>
        <Container>
            {/* ManageUsersContent 로 빠질수도 있다. */}
            <div className="grid gap-5 lg:gap-7.5">
                {/* search bar */}
                <ManageUsersContent />
                {/* user list table */}
            </div>
            
        </Container>
    </Fragment>
    )

  return (
    <div>
      <h1>Manage Users</h1>
      {/* Add your user management components here */}
    </div>
  );
}

export default ManageUsersPage;
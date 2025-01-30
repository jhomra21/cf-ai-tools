import type { Component } from "solid-js";
import { RouteSectionProps } from "@solidjs/router";
import Nav from "./Nav";
import Footer from "./Footer";
import PageTransition from "./PageTransition";

const Layout: Component<RouteSectionProps> = (props) => {
  return (
    <div class="min-h-screen bg-[#0A0A0A] relative flex flex-col">
      {/* Subtle grid pattern overlay */}
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIiBzdHJva2U9IiMyRDJEM0QiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9zdmc+')] opacity-50 pointer-events-none" />
      
      <Nav />
      
      {/* Main content with industrial spacing */}
      <main class="relative flex-1">
        <div class="relative">
          <PageTransition params={props.params} location={props.location} data={props.data}>
            {props.children}
          </PageTransition>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Layout; 
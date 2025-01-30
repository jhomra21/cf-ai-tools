import { Component } from "solid-js";
import { Transition } from "solid-transition-group";
import { RouteSectionProps } from "@solidjs/router";

const PageTransition: Component<RouteSectionProps> = (props) => {
  return (
    <Transition
      name="fade"
      appear={true}
      mode="outin"
    >
      {props.children}
    </Transition>
  );
};

export default PageTransition; 
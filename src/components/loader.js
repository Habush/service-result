import React from "react";
import { Spin } from "antd";

export const Loader = props => {
  return (
    <React.Fragment>
      <Spin style={{ marginRight: "15px" }} />
      <span> {props.message}</span>
    </React.Fragment>
  );
};

import React from "react";
import {
  Progress,
  Button,
  Icon,
  Alert,
  Collapse,
  message,
  Select,
  InputNumber,
  Modal,
  Table
} from "antd";
import moment from "moment";
import { AnalysisStatus, filterResult, getQueryValue } from "../utils";
import { Loader } from "./loader";
import { safeDump } from "js-yaml";
import ReactJson from "react-json-view";

const formatDecimal = num => parseFloat(num).toFixed(6);

const formatResult = r => {
  const models = JSON.parse(r.models);
  return models.map(m => {
    const model = Object.assign({}, m);
    model.accuracy_train = formatDecimal(model.accuracy_train);
    model.accuracy_test = formatDecimal(model.accuracy_train);
    model.precision_train = formatDecimal(model.precision_train);
    model.precision_test = formatDecimal(model.precision_test);
    model.recall_train = formatDecimal(model.recall_train);
    model.recall_test = formatDecimal(model.recall_test);
    model.f1_train = formatDecimal(model.f1_train);
    model.f1_test = formatDecimal(model.f1_test);
    model.p_value_train = formatDecimal(model.p_value_train);
    model.p_value_test = formatDecimal(model.p_value_test);
    return model;
  });
};

const columns = [
  {
    title: "Model",
    dataIndex: "model",
    key: "model",
    width: 200
  },
  {
    title: "Complexity",
    dataIndex: "complexity",
    key: "complexity",
    width: 90
  },
  {
    title: "Accuracy",
    children: [
      {
        title: "Train",
        dataIndex: "accuracy_train",
        key: "accuracy_train"
      },
      {
        title: "Test",
        dataIndex: "accuracy_test",
        key: "accuracy_test"
      }
    ]
  },
  {
    title: "Recall",
    children: [
      {
        title: "Train",
        dataIndex: "recall_train",
        key: "recall_train"
      },
      {
        title: "Test",
        dataIndex: "recall_test",
        key: "recall_test"
      }
    ]
  },
  {
    title: "Precision",
    children: [
      {
        title: "Train",
        dataIndex: "precision_train",
        key: "precision_train"
      },
      {
        title: "Test",
        dataIndex: "precision_test",
        key: "precision_test"
      }
    ]
  },
  {
    title: "p-value",
    children: [
      {
        title: "Train",
        dataIndex: "p_value_train",
        key: "p_value_train"
      },
      {
        title: "Test",
        dataIndex: "p_value_test",
        key: "p_value_test"
      }
    ]
  },
  {
    title: "f1",
    children: [
      {
        title: "Train",
        dataIndex: "f1_train",
        key: "f1_train"
      },
      {
        title: "Test",
        dataIndex: "f1_test",
        key: "f1_test"
      }
    ]
  }
];

export class Result extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showFilterForm: false,
      showMosesOptions: false,
      mosesOptions: undefined,
      filterParameter: "accuracy",
      filterValue: 0.5,
      filtering: false,
      filteredResult: undefined
    };
    this.filter = this.filter.bind(this);
    this.fetchMosesOptions = this.fetchMosesOptions.bind(this);
  }

  fetchMosesOptions() {
    fetch(`${this.props.server_address}/session/${this.props.analysisId}`)
      .then(res => res.json())
      .then(
        function(data) {
          this.setState({ mosesOptions: data });
        }.bind(this)
      );
    return <Loader message={"Fetching moses options ..."} />;
  }

  downloadMosesOptions() {
    const yaml = `data:text/yaml;charset=utf-8, ${encodeURIComponent(
      safeDump(this.state.mosesOptions)
    )}`;
    const link = document.createElement("a");
    link.setAttribute("href", yaml);
    link.setAttribute("download", "moses-options.yaml");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  filter() {
    this.setState({ filtering: true });
    filterResult(
      getQueryValue("id"),
      this.state.filterParameter,
      this.state.filterValue
    ).then(response => {
      response.models
        ? this.setState({
            filtering: false,
            filteredResult: response
          })
        : message.error(
            response.message || "An error occured, please try again later!"
          );
    });
  }

  render() {
    const {
      progress,
      status,
      start,
      end,
      message,
      downloadResult,
      expirationTime
    } = this.props;
    const progressBarProps = {
      percent: progress
    };
    if (status === AnalysisStatus.ACTIVE) {
      progressBarProps["status"] = "active";
    }

    const progressBar = <Progress {...progressBarProps} />;

    const renderValidationError = () => {
      const { filterParameter, filterValue } = this.state;
      return filterValue === "" ? (
        <p style={{ color: "maroon" }}>
          Please enter value for {filterParameter}
        </p>
      ) : isNaN(filterValue) ? (
        <p style={{ color: "maroon" }}>
          Filter value must be a number between 0 and 1.
        </p>
      ) : filterValue <= 0 ? (
        <p style={{ color: "maroon" }}>
          Filter value must be greater than zero.
        </p>
      ) : filterValue >= 1 ? (
        <p style={{ color: "maroon" }}>Filter value must be less than one.</p>
      ) : null;
    };

    return (
      <React.Fragment>
        {status === AnalysisStatus.ACTIVE && (
          <span>
            Analysis started
            {" " + moment(start * 1000).fromNow()}
            {progressBar}
            <span style={{ marginTop: "15px" }}>
              The analysis might take a while depending on the size of the
              dataset and analysis parameter values.
            </span>
          </span>
        )}

        {status === AnalysisStatus.COMPLETED && (
          <span>
            {expirationTime > 0 ? (
              <React.Fragment>
                Analysis completed after
                {" " +
                  moment.duration(end - start, "seconds").humanize()}
                {progressBar}
                <Alert
                  id="willExpireNotice"
                  style={{ marginTop: "15px" }}
                  type="warning"
                  message={
                    "The download link will expire in " +
                    moment.duration(expirationTime, "seconds").humanize()
                  }
                  closable
                  description={
                    "You may download the analysis result file within " +
                    moment.duration(expirationTime, "seconds").humanize() +
                    ". The link will expire afterwards."
                  }
                />
                <br />
                <Button
                  onClick={() => this.setState({ showFilterForm: true })}
                  style={{ marginRight: 5 }}
                >
                  <Icon type="filter" />
                  Filter results
                </Button>
                <Button
                  onClick={() => this.setState({ showMosesOptions: true })}
                  style={{ marginRight: 5 }}
                >
                  <Icon type="eye" />
                  View moses options
                </Button>
                <Button
                  id="downloadAnalysisResult"
                  type="primary"
                  onClick={downloadResult}
                >
                  <Icon type="download" />
                  Download analysis results
                </Button>
              </React.Fragment>
            ) : (
              <Alert
                id="didExpireNotice"
                style={{ marginTop: "15px" }}
                type="error"
                message="Link expired"
                description="You can no longer access analysis results"
              />
            )}
            <Modal
              centered
              title="Filter analysis result"
              visible={this.state.showFilterForm}
              onOk={() => this.filter()}
              onCancel={() => this.setState({ showFilterForm: false })}
              okText={
                <span style={{ marginLeft: this.state.filtering ? 10 : 0 }}>
                  Filter
                </span>
              }
              okButtonProps={{
                disabled: renderValidationError(),
                loading: this.state.filtering
              }}
              bodyStyle={{ paddingTop: 0, paddingBottom: 0 }}
            >
              <div style={{ marginTop: 15, marginBottom: 15 }}>
                <Select
                  onChange={param => this.setState({ filterParameter: param })}
                  defaultValue={this.state.filterParameter}
                  style={{ width: 150, marginRight: 5 }}
                >
                  <Option value="accuracy">Accuracy</Option>
                  <Option value="precision">Precision</Option>
                  <Option value="recall">Recall</Option>
                  <Option value="p-Value">P-Value</Option>
                  <Option value="f1-score">F1-score</Option>
                </Select>
                {this.state.filterParameter !== "none" && (
                  <InputNumber
                    min={0}
                    max={1}
                    defaultValue={this.state.filterValue}
                    placeholder="Enter value"
                    style={{
                      width: 200
                    }}
                    onChange={value => this.setState({ filterValue: value })}
                  />
                )}
                {renderValidationError()}
              </div>
            </Modal>
            {this.state.filteredResult && (
              <Modal
                centered
                title="Analysis result"
                visible={true}
                onOk={() => downloadFilteredResult(getQueryValue("id"))}
                onCancel={() => this.setState({ filteredResult: undefined })}
                okText={
                  <React.Fragment>
                    <Icon type="download" style={{ marginRight: 5 }} />
                    Download filtered result
                  </React.Fragment>
                }
                bodyStyle={{ paddingTop: 0, paddingBottom: 0 }}
                width={1200}
              >
                <div style={{ marginTop: 15, marginBottom: 15 }}>
                  <Table
                    dataSource={formatResult(this.state.filteredResult)}
                    columns={columns}
                    size="small"
                    bordered
                    pagination={{ pageSize: 5 }}
                    rowKey="model"
                  />
                </div>
              </Modal>
            )}
            {this.state.showMosesOptions && (
              <Modal
                centered
                title="Moses Options"
                visible={true}
                onOk={() => this.downloadMosesOptions()}
                onCancel={() => this.setState({ showMosesOptions: false })}
                okText={
                  <React.Fragment>
                    <Icon type="download" style={{ marginRight: 5 }} />
                    Download as YAML file
                  </React.Fragment>
                }
                bodyStyle={{ paddingTop: 0, paddingBottom: 0 }}
                okButtonProps={{ disabled: !this.state.mosesOptions }}
              >
                <div style={{ marginTop: 15, marginBottom: 15 }}>
                  {this.state.mosesOptions ? (
                    <ReactJson
                      src={this.state.mosesOptions}
                      enableClipboard={false}
                      displayDataTypes={false}
                      displayObjectSize={false}
                      name={null}
                    />
                  ) : (
                    this.fetchMosesOptions()
                  )}
                </div>
              </Modal>
            )}
          </span>
        )}

        {status === AnalysisStatus.ERROR && (
          <Alert
            id="errorMessage"
            justify="left"
            type="error"
            message={
              "Analysis failed after " +
              moment.duration(moment(end).diff(moment(start))).humanize()
            }
            description={
              <Collapse
                bordered={false}
                style={{
                  background: "none",
                  boxShadow: "none",
                  textAlign: "left"
                }}
              >
                <Collapse.Panel
                  style={{ backgroundColor: "#f8d8d7" }}
                  header="Show stacktrace"
                  key="1"
                >
                  {message}
                </Collapse.Panel>
              </Collapse>
            }
          />
        )}
      </React.Fragment>
    );
  }
}

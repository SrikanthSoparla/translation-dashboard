import React, { Component } from 'react'
import {
  Table,
  Input,
  InputNumber,
  Icon,
  Button,
  Popconfirm,
  Form,
  Row,
  Col,
  Menu,
  Select,
  Dropdown,
  Pagination,
  Checkbox,
} from 'antd'
import jwt from 'jsonwebtoken'
import { CSVLink, CSVDownload } from 'react-csv'
import js2xmlparser from 'js2xmlparser'
import './style.css'
import { connect } from 'react-redux'
import axios from 'axios'
// import data2xml from 'data2xml';
import fileDownload from 'js-file-download'
import Aux from '../../../Hoc/Aux'
import { changeConfirmLocale } from 'antd/lib/modal/locale';

const Json2csvParser = require('json2csv').Parser
const mapStateToProps = state => {
  // console.log('in view details', state.app.language)
  return {
    language: state.app.language,
  }
}

const GET_URL = 'https://version-api.sentinelgroup.io/message?appCode=SNC'
const GET_URL_DROPDOWN = 'https://version-api.sentinelgroup.io/message?appCode='
const SEARCH_URL = 'https://version-api.sentinelgroup.io/message/search?'
// const XML_DOWNLOAD_URL = 'http://35.231.37.43:3000/message/xml?appCode='
const XML_DOWNLOAD_URL = 'https://version-api.sentinelgroup.io/message/xml?appCode='

const FormItem = Form.Item
const Search = Input.Search
const Option = Select.Option

const { TextArea } = Input

const EditableContext = React.createContext()
const EditableRow = ({ form, index, ...props }) => (
  <EditableContext.Provider value={form}>
    <tr {...props} />
  </EditableContext.Provider>
)

const EditableFormRow = Form.create()(EditableRow)

@connect(mapStateToProps)
class EditableCell extends React.Component {
  state = {
    editing: false,
  }

  componentDidMount() {
    // if (this.props.editable) {
    //   document.addEventListener('click', this.handleClickOutside, true)
    // }
  }

  componentWillUnmount() {
    // if (this.props.editable) {
    //   document.removeEventListener('click', this.handleClickOutside, true)
    // }
  }

  toggleEdit = () => {
    const editing = !this.state.editing
    this.setState({ editing }, () => {
      if (editing) {
        this.input.focus()
      }
    })
  }

  // handleClickOutside = e => {
  //   const { editing } = this.state
  //   if (editing && this.cell !== e.target && !this.cell.contains(e.target)) {
  //     this.save()
  //   }
  // }

  save = () => {
    const { record, handleSave } = this.props
    this.form.validateFields((error, values) => {
      if (error) {
        return
      }
      this.toggleEdit()
      handleSave({ ...record, ...values })
    })
  }

  render() {
    const { editing } = this.state
    const { editable, dataIndex, title, record, index, handleSave, ...restProps } = this.props
    return (
      <td ref={node => (this.cell = node)} {...restProps}>
        {editable ? (
          <EditableContext.Consumer>
            {form => {
              this.form = form
              return editing ? (
                <FormItem style={{ margin: 0 }}>
                  {form.getFieldDecorator(dataIndex, {
                    // rules: [{
                    //   required: true,
                    //   message: `${title} is required.`,
                    // }],
                    initialValue: record[dataIndex],
                  })(
                    <TextArea
                      ref={node => (this.input = node)}
                      onPressEnter={this.save}
                      rows="5"
                      onBlur={this.save}
                    />,
                  )}
                </FormItem>
              ) : (
                  <div
                    className="editable-cell-value-wrap"
                    style={{ paddingRight: 24 }}
                    onClick={this.toggleEdit}
                  >
                    {restProps.children}
                  </div>
                )
            }}
          </EditableContext.Consumer>
        ) : (
            restProps.children
          )}
      </td>
    )
  }
}

let data = []
let searchResults = []
let token = ''
let username = ''

const config = {
  pagination: {
    pageSizeOptions: ['10', '20', '50', '100'],
    showSizeChanger: true,
  },
}

@connect(mapStateToProps)
class EditableTable extends React.Component {
  state = {
    data: [],
    editingKey: '',
    data1: [],
    xmldata: [],
    csvdata: [],
    rowData: [],
    pagination: '',
    currentData: [],
    project: 'SNC',
    language: [],
    languages: ['english', 'russian', 'spanish', 'chinese', 'japanese', 'turkish', 'persian'],
    count: '',
    storeFile: [],
    selectedlanguages: ['english'],
    xmlLanguages: [],
    url: [],
    addCount: 0,
    pageSize: 10
  }

  componentWillMount = () => {
    // console.log(this.props,'in will mount')

    fetch(GET_URL)
      .then(resp => resp.json())
      .then(body => {
        this.setState({
          language: this.props.language
            ? this.props.language
            : sessionStorage.getItem('userLanguage'),
          data1: body.messages,
        })

        // console.log("messages ",this.state.data1);
        data = []
        // if (this.state.project === 'SENTINEL') {
        body.messages.map((v, i) => {
          data.push({
            key: i,
            name: v.name,
            english: v.message.english === null ? 'NA' : v.message.english,
            russian: v.message.russian === null ? 'NA' : v.message.russian,
            spanish: v.message.spanish === null ? 'NA' : v.message.spanish,
            chinese: v.message.chinese === undefined ? 'NA' : v.message.chinese,
            japanese: v.message.japanese === undefined ? 'NA' : v.message.japanese,
            turkish: v.message.turkish === undefined ? 'NA' : v.message.turkish,
            persian: v.message.persian === undefined ? 'NA' : v.message.persian,

          })
        })
        // }

        // else {
        //   body.messages.map((v, i) => {
        //     // console.log("v data ", v);
        //     data.push({
        //       key: i,
        //       name: v.name,
        //       english: v.message.english === null ? 'NA' : v.message.english,
        //       russian: v.message.russian === null ? 'NA' : v.message.russian,
        //       spanish: v.message.spanish === null ? 'NA' : v.message.spanish,
        //     })
        //   })
        // }
        // console.log("changed ",data);

        this.setState({
          rowData: data,
          currentData: data,
          count: data.length,
        })

        // console.log("current data ", this.state.currentData);
      })
    token = localStorage.getItem('token')
    if (token) {
      // console.log("decoded ", jwt.decode(token).data[0].name);
      username = jwt.decode(token).data[0].name
    }
    if (this.props.language !== 'english') {
      this.state.selectedlanguages.push(this.props.language)
      // console.log("lang ", this.props.language);
      if (this.props.language === 'all') {
        this.state.selectedlanguages.splice(0, 2, 'english', 'russian', 'spanish', 'chinese', 'japanese', 'turkish', 'persian')
        // console.log("selected ", this.state.selectedlanguages);
      }
    }
  }

  // handleChange(value) {
  //   console.log(`selected ${value}`);

  // }
  handleChange = value => {
    this.setState({
      project: value,
    })
    fetch(GET_URL_DROPDOWN + value)
      .then(resp => resp.json())
      .then(body => {
        this.setState({
          data1: body.messages,
        })
        // console.log("messages ",this.state.data1);
        data = []
        // if (this.state.project === 'SENTINEL') {
        body.messages.map((v, i) => {
          data.push({
            key: i,
            name: v.name,
            english: v.message.english === null ? 'NA' : v.message.english,
            russian: v.message.russian === null ? 'NA' : v.message.russian,
            spanish: v.message.spanish === null ? 'NA' : v.message.spanish,
            chinese: v.message.chinese === undefined ? 'NA' : v.message.chinese,
            japanese: v.message.japanese === undefined ? 'NA' : v.message.japanese,
            turkish: v.message.turkish === undefined ? 'NA' : v.message.turkish,
            persian: v.message.persian === undefined ? 'NA' : v.message.persian,
          })
        })
        // }

        this.setState({
          rowData: data,
          currentData: data,
          count: data.length,
        })
      })
    // console.log("data" , this.state.rowData)
  }

  handleBlur() {
    // console.log('blur');
  }

  handleFocus() {
    // console.log('focus');
  }

  onShowSizeChange(current, pageSize) {
    console.log(current, pageSize)
  }
  handleSave = row => {
    console.log('row ', row)
    const key = row.key
    const newData = [...this.state.rowData]
    const index = newData.findIndex(item => row.key === item.key)
    const item = newData[index]
    newData.splice(index, 1, {
      ...item,
      ...row,
    })
    let data1 = this.state.data1
    // newData[key]["russian"] = newData[key]["spanish"] === 'NA' ? null : newData[key]["spanish"]
    // console.log('new data ', newData[key])
    // if (this.state.project === 'SENTINEL') {
    data1[key]['message']['english'] =
      newData[key]['english'] === '' ? 'NA' : newData[key]['english']
    data1[key]['message']['spanish'] =
      newData[key]['spanish'] === '' ? 'NA' : newData[key]['spanish']
    data1[key]['message']['russian'] =
      newData[key]['russian'] === '' ? 'NA' : newData[key]['russian']
    data1[key]['message']['chinese'] =
      newData[key]['chinese'] === '' ? 'NA' : newData[key]['chinese']
    data1[key]['message']['japanese'] =
      newData[key]['japanese'] === '' ? 'NA' : newData[key]['japanese']
    data1[key]['message']['turkish'] =
      newData[key]['turkish'] === '' ? 'NA' : newData[key]['turkish']

    data1[key]['message']['persian'] =
      newData[key]['persian'] === '' ? 'NA' : newData[key]['persian']
    // }
    // else {
    //   data1[key]['message']['english'] = newData[key]['english']
    //   data1[key]['message']['spanish'] = newData[key]['spanish']
    //   data1[key]['message']['russian'] = newData[key]['russian']
    // }
    this.setState({ rowData: newData, data1: data1 })

    //  console.log("key ", key);
    // console.log('if condition', newData)
    // console.log(" data 1 " , this.state.data1 );
    // this.saveHandler = (e,i) => {
    fetch('https://version-api.sentinelgroup.io/message', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: this.state.data1[key]['name'],
        message: this.state.data1[key]['message'],
        appCode: this.state.project,
      }),
    })
  }

  selectedXmlLanguages = (langLength, languagesLength) => {
    const lang = this.state.selectedlanguages

    this.setState({ url: [] })  // not to push on the previously exported url

    if (langLength === languagesLength) {
      for (let i in lang) {
        this.state.url.push('&languages[]=' + lang[i])
      }
      return 'alllanguagemessages.xml'
    } else {
      for (let i in lang) {
        this.state.url.push('&languages[]=' + lang[i])
      }
      return lang.join('_') + '.xml'
      // console.log(file);
    }
  }

  render() {
    // let lang = this.state.language
    const defaultLanguage = this.props.language

    const clickHandler = (event, selectedLang) => {
      // console.log("selected lang ",selectedLang);
      const langFun = this.state.selectedlanguages
      // console.log("lang fun ", langFun);
      const indexOfLangFun = langFun.indexOf(selectedLang)

      // console.log("fun ",langFun.indexOf(selectedLang));

      if (indexOfLangFun > -1) {
        langFun.splice(indexOfLangFun, 1)
      } else {
        langFun.push(selectedLang)
      }
      this.setState({ selectedlanguages: langFun })
      // this.setState({lang: selectedLang});
    }

    let columnsData =
      // this.state.project === 'SENTINEL'
      //   ?
      [
        {
          title: 'Variable',
          dataIndex: 'name',
          width: '5%',
          key: 'name',
          editable: true,
          className: 'editable_class variable_name',
        },
        {
          title: 'English',
          dataIndex: 'english',
          key: 'english',
          sorter: (a, b) => {
            return a.english > b.english ? 1 : -1
          },
          width: '10%',
          editable: defaultLanguage === 'english' || defaultLanguage === 'all',
          className: this.props.language === 'english' ? 'editable_class' : (this.props.language === 'all'
            ? this.state.selectedlanguages.indexOf('english') > -1 ?
              'editable_class'
              : 'non_editable_class'
            : 'visible_class'),
          // className : project === "SENTINEL" ? "show" : "hide",
        },
        {
          title: 'Russian',
          dataIndex: 'russian',
          key: 'russian',
          width: '10%',
          sorter: (a, b) => {
            return a.russian > b.russian ? 1 : -1
          },
          editable: defaultLanguage === 'russian' || defaultLanguage === 'all',
          className:
            this.state.selectedlanguages.indexOf('russian') > -1
              ? this.props.language === 'russian' || defaultLanguage === 'all'
                ? 'editable_class'
                : 'visible_class'
              : 'non_editable_class',
        },
        {
          title: 'Spanish',
          dataIndex: 'spanish',
          width: '10%',
          sorter: (a, b) => {
            return a.spanish > b.spanish ? 1 : -1
          },
          editable: defaultLanguage === 'spanish' || defaultLanguage === 'all',
          className:
            this.state.selectedlanguages.indexOf('spanish') > -1
              ? this.props.language === 'spanish' || defaultLanguage === 'all'
                ? 'editable_class'
                : 'visible_class'
              : 'non_editable_class',
        },
        {
          title: 'Chinese',
          dataIndex: 'chinese',
          width: '10%',
          sorter: (a, b) => {
            return a.chinese > b.chinese ? 1 : -1
          },
          editable: defaultLanguage === 'chinese' || defaultLanguage === 'all',
          className:
            this.state.selectedlanguages.indexOf('chinese') > -1
              ? this.props.language === 'chinese' || defaultLanguage === 'all'
                ? 'editable_class'
                : 'visible_class'
              : 'non_editable_class',
        },
        {
          title: 'Japanese',
          dataIndex: 'japanese',
          width: '10%',
          sorter: (a, b) => {
            return a.japanese > b.japanese ? 1 : -1
          },
          editable: defaultLanguage === 'japanese' || defaultLanguage === 'all',
          className:
            this.state.selectedlanguages.indexOf('japanese') > -1
              ? this.props.language === 'japanese' || defaultLanguage === 'all'
                ? 'editable_class'
                : 'visible_class'
              : 'non_editable_class',
        },
        {
          title: 'Turkish',
          dataIndex: 'turkish',
          width: '10%',
          sorter: (a, b) => {
            return a.turkish > b.turkish ? 1 : -1
          },
          editable: defaultLanguage === 'turkish' || defaultLanguage === 'all',
          className:
            this.state.selectedlanguages.indexOf('turkish') > -1
              ? this.props.language === 'turkish' || defaultLanguage === 'all'
                ? 'editable_class'
                : 'visible_class'
              : 'non_editable_class',
        },

        {
          title: 'Persian',
          dataIndex: 'persian',
          width: '10%',
          sorter: (a, b) => {
            return a.persian > b.persian ? 1 : -1
          },
          editable: defaultLanguage === 'persian' || defaultLanguage === 'all',
          className:
            this.state.selectedlanguages.indexOf('persian') > -1
              ? this.props.language === 'persian' || defaultLanguage === 'all'
                ? 'editable_class'
                : 'visible_class'
              : 'non_editable_class',
        },
      ]
    // : [
    //     {
    //       title: 'Variable',
    //       dataIndex: 'name',
    //       width: '5%',
    //       editable: true,
    //       className: 'editable_class variable_name',
    //     },
    //     {
    //       title: 'English',
    //       dataIndex: 'english',
    //       // key: 'english',
    //       sorter: (a, b) => {
    //         return a.english > b.english ? 1 : -1
    //       },
    //       width: '10%',
    //       editable: lang === 'english' || lang === 'all',
    //       className:
    //         lang === 'english' || lang === 'all' ? 'editable_class' : 'non_editable_class',
    //       // className : project === "SENTINEL" ? "show" : "hide",
    //     },
    //     {
    //       title: 'Russian',
    //       dataIndex: 'russian',
    //       sorter: (a, b) => {
    //         return a.russian > b.russian ? 1 : -1
    //       },
    //       width: '10%',
    //       editable: lang === 'russian' || lang === 'all',
    //       className:
    //         lang === 'russian' || lang === 'all' ? 'editable_class' : 'non_editable_class',
    //     },
    //     {
    //       title: 'Spanish',
    //       dataIndex: 'spanish',
    //       width: '10%',
    //       sorter: (a, b) => {
    //         return a.spanish > b.spanish ? 1 : -1
    //       },
    //       editable: lang === 'spanish' || lang === 'all',
    //       className:
    //         lang === 'spanish' || lang === 'all' ? 'editable_class' : 'non_editable_class',
    //     },
    //   ]

    this.handleAdd = () => {
      // console.log("adding...");
      const { count, rowData, data1 } = this.state;
      // console.log("count ", count);
      let newData, dbData;
      // if (this.state.project === 'SENTINEL') {
      newData = {
        key: count,
        name: `give new variable name ${count}`,
        english: 'NA',
        russian: 'NA',
        spanish: 'NA',
        chinese: 'NA',
        japanese: 'NA',
        turkish: 'NA',
        persian: 'NA',
      }
      dbData = {
        appCode: this.state.project,
        name: `give new variable name ${count}`,
        message: {
          english: 'NA',
          russian: 'NA',
          spanish: 'NA',
          chinese: 'NA',
          japanese: 'NA',
          turkish: 'NA',
          persian: 'NA',
        },
      }
      // }
      //  else {
      //   newData = {
      //     key: count,
      //     name: `give new variable name ${count}`,
      //     english: '',
      //     russian: '',
      //     spanish: '',
      //   }
      //   dbData = {
      //     appCode: this.state.project,
      //     name: `give new variable name ${count}`,
      //     message: {
      //       english: '',
      //       russian: '',
      //       spanish: '',
      //     },
      //   }
      // }

      let result = [...rowData];
      let resultdbData = [...data1];

      result.splice(this.state.pageSize - 1, 0, newData);
      resultdbData.splice(this.state.pageSize - 1, 0, dbData)

      this.setState({
        rowData: [...result],
        data1: [...resultdbData],
        count: count + 1,
        addCount: this.state.addCount + 1
      })

      console.log("new added data ", this.state.rowData);
      console.log("new added data ", this.state.data1);
    }

    this.handleRemove = () => {
      const { count, rowData, data1 } = this.state;
      // console.log("count ", count);
      let removeRow = [...rowData];
      let removedbData = [...data1];

      if(this.state.addCount !== 0) {
        removeRow.splice(this.state.pageSize - 1, 1);
        removedbData.splice(this.state.pageSize - 1, 1);
        this.setState({rowData: removeRow, data1: removedbData, addCount: this.state.addCount - 1});
      }
      console.log('remove data', this.state.rowData);
      console.log('remove data', this.state.data1);
    }

    this.xmlDownloader = () => {
      // let stringsFile = [] ;
      // let storeFile = [];
      // this.setState({
      //   storeFile:[]
      // })
      // this.setState({
      //   xmldata : js2xmlparser.parse("resources", this.state.rowData)
      // })

      // console.log("row data", this.state.rowData);

      const file = this.selectedXmlLanguages(
        this.state.selectedlanguages.length,
        this.state.languages.length,
      )
      const url = this.state.url.join('')

      let resp = axios.get(XML_DOWNLOAD_URL + this.state.project + url).then(v => {
        // console.log("vdata ", v.data);
        // console.log(v.data)
        this.setState({ xmldata: v.data })
        fileDownload(v.data, file)
      })
      // console.log("res ",resp.data);
    }

    this.csvDownloader = () => {
      // console.log(js2xmlparser.parse("person", this.state.rowData));

      const fields =
        // this.state.project === 'SENTINEL'
        //   ?
        ['name', 'english', 'russian', 'spanish', 'chinese', 'japanese', 'turkish', ' persian']
      // : ['name', 'english', 'russian', 'spanish']
      const json2csvParser = new Json2csvParser({
        fields,
        unwind: ['items', 'items.items'],
        unwindBlank: true,
      })
      const csv = json2csvParser.parse(this.state.rowData)
      this.setState({
        csvdata: csv,
      })
    }
    this.searchHandler = event => {
      // console.log("initial data ",event);
      let searchKey = event.target.value.trim()
      // console.log("search key ", searchKey);
      // http://192.168.0.39:3000/message/search?appCode=SLC&searchKey=s
      let url = SEARCH_URL + 'appCode=' + this.state.project + '&searchKey=' + searchKey

      if (searchKey !== '') {
        fetch(url)
          .then(resp => resp.json())
          .then(body => {
            if (body) {
              // console.log("info ", body.info);
              if (body.info === []) {
                this.setState({
                  rowData: this.state.currentData,
                })
              } else {
                searchResults = []

                body.info.map((v, i) => {
                  searchResults.push({
                    key: i,
                    name: v.name,
                    english: v.message.english,
                    russian: v.message.russian,
                    spanish: v.message.spanish,
                    chinese: v.message.chinese,
                    japanese: v.message.japanese,
                    turkish: v.message.turkish,
                    persian: v.message.persian,
                  })
                })
                console.log('search result ', searchResults)
                this.setState({
                  rowData: searchResults,
                })
                // console.log("new data ", this.state.rowData);
              }
            } else {
              this.setState({
                rowData: this.state.currentData,
              })
              //  console.log("no data found");
            }
          })
          .catch(err => console.log('error ', err))
      } else {
        this.setState({
          rowData: this.state.currentData,
        })
      }
    }

    const { dataSource } = this.state
    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell,
      },
    }
    const columns = columnsData.map(col => {
      if (!col.editable) {
        return col
      }
      return {
        ...col,
        onCell: record => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave,
        }),
      }
    })

    const changeshow = (event) => {
      // console.log(event.pageSize);
      this.setState({pageSize: event.pageSize})
    }

    const languageComponent = this.state.languages.map(lang => {
      return (
        <div key={lang} className="Checkbox">
          {(() => {
            if (defaultLanguage === 'all') {
              return (
                <Aux>
                  <Checkbox
                    type="checkbox"
                    id={lang}
                    onChange={event => clickHandler(event, lang)}
                    defaultChecked
                  />
                  <label htmlFor={lang} style={{ cursor: 'pointer', marginLeft: '30px' }}>
                    {' '}
                    {lang}{' '}
                  </label>
                </Aux>
              );
            }
            else if (lang === defaultLanguage || lang === 'english') {
              return (
                <Aux>
                  <Checkbox
                    type="checkbox"
                    id={lang}
                    onChange={event => clickHandler(event, lang)}
                    disabled
                    checked
                  />
                  <label htmlFor={lang} style={{ cursor: 'pointer', marginLeft: '30px' }}>
                    {' '}
                    {lang}{' '}
                  </label>
                </Aux>
              );
            }
            else {
              return (
                <Aux>
                  <Checkbox type="checkbox"
                    id={lang}

                    onChange={event => clickHandler(event, lang)}
                  />
                  <label htmlFor={lang} style={{ cursor: 'pointer', marginLeft: '30px' }}>
                    {' '}
                    {lang}{' '}
                  </label>
                </Aux>
              );
            }
          })()}
        </div>
      )
    })

    return (
      <div className="translation_dashboard">
        <div>
          <div className="col-lg-12">
            <div className="col-md-12 col-xl-12">
              <div className="card header_card">
                <div className=" header_card row_1">
                  <div className="utils__title">
                    <Row className="row_1">
                      <Col span={24}>
                        <div className="header">
                          {/* <span className="header_name">
                        CONTENT DASHBOARD FOR SNC/SLC  (English)
                      </span> */}
                          <div className="searchbar">
                            <Search
                              placeholder="Search..."
                              onSearch={value => console.log(value)}
                              onKeyUp={this.searchHandler}
                              style={{ width: 300 }}
                            />
                          </div>
                          <div>
                            <span className="select_project"> Select Project: </span>
                            <Select
                              showSearch
                              style={{ width: 200, marginLeft: 20 }}
                              defaultValue="SNC"
                              optionFilterProp="children"
                              onChange={this.handleChange}
                              onFocus={this.handleFocus}
                              onBlur={this.handleBlur}
                              filterOption={(input, option) =>
                                option.props.children.toLowerCase().indexOf(input.toLowerCase()) >=
                                0
                              }
                            >
                              {/* <Option value="SNC">SNC-MOBILE</Option> */}
                              <Option value="SNC">SNC-MOBILE_0.1.9</Option>
                              <Option value="SLC">SLC-MOBILE</Option>
                              <Option value="SENTINEL">SENTINEL-WEBSITE</Option>
                              <Option value="DESKTOP_APP">SENTINEL-DESKTOP</Option>
                              {/* <Option value="SWIXER">SWIXER(Coming soon)</Option> */}
                            </Select>
                          </div>

                          <div className="row_2_buttons">
                            <div className="dropdown">
                              <button className="dropbtn">
                                Export
                                <Icon
                                  type="down"
                                  theme="outlined"
                                  style={{ marginLeft: '5px', marginTop: '-5px' }}
                                />{' '}
                              </button>
                              <div className="export_section">
                                {/* <div><CSVLink data={this.state.xmldata} filename={"strings.xml"} target="_blank" onClick= {this.xmlDownloader}>XML</CSVLink></div> */}
                                <div>
                                  <a className="download_xml" onClick={this.xmlDownloader}>
                                    XML
                                  </a>
                                </div>

                                <div>
                                  <CSVLink
                                    data={this.state.csvdata}
                                    filename={'my-file.csv'}
                                    target="_blank"
                                    onClick={this.csvDownloader}
                                  >
                                    CSV
                                  </CSVLink>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="row_2_buttons">
                            <div className="dropdown">
                              <button className="dropbtn">
                                Languages
                                <Icon
                                  type="down"
                                  theme="outlined"
                                  style={{ marginLeft: '5px', marginTop: '-5px' }}
                                />{' '}
                              </button>
                              <div className="export_section">{languageComponent}</div>
                            </div>
                          </div>

                          {/* <div style={{    display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginTop: '25px'}}>
                            <button onClick={this.xmlDownloader}> Export Selected Languages </button>
                          </div> */}
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="col-lg-12">
            <div className="col-md-12 col-xl-12">
              <div className="card">
                <Table
                  {...config}
                  components={components}
                  rowClassName={() => 'editable-row'}
                  bordered
                  dataSource={this.state.rowData}
                  columns={columns}
                  scroll={{ x: 1000 }}
                  onChange={(event) => changeshow(event)}
                // scroll={{ y: 650 }}
                />

                <div className="total_records">Total Records : {this.state.rowData.length}</div>
                {/* <Pagination showSizeChanger onShowSizeChange={this.onShowSizeChange} defaultCurrent={1} total={500} 
            showTotal = {total =>  `Total ${this.state.rowData.length} items`}
            pageSizeOptions = { ['10','15','20','25'] }/> */}
              </div>
              <Button onClick={this.handleAdd} type="primary"
                style={{ marginBottom: 0, width: 150, }}
                className="add_row"
              >
                Add a row
                </Button>
                {this.state.addCount !== 0 ?
                <Button onClick={this.handleRemove} type="primary"
                style={{ marginBottom: 0, width: 250, float: "right" }}
                className="add_row"
              >
                Remove Recently Added Rows
                </Button> : null
              }
              
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default EditableTable

// WEBPACK FOOTER //
// ./src/pages/TranslationPage/ViewDetails/index.js

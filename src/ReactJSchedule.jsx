/* eslint-disable consistent-return */
import { Col, Row, Typography } from 'antd';
import React, { useEffect, useReducer, useState, useCallback, createElement } from 'react';
import { CellUnit, DATETIME_FORMAT, DATE_FORMAT, SummaryPos, ViewType } from './config/default';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DnDSource from './components/DnDSource';
import wrapperFun from './components/WrapperFun';
import SchedulerData from './model/SchedulerData';

import ResourceItem from './model/ResourceItem';
import ResourceList from './model/ResourceList';
import TaskItem from './model/TaskItem';
import TaskList from './model/TaskList';
import DemoData from './model/DemoData';
import { DnDTypes } from './model/DnDTypes';

import "./ui/ReactJSchedule.css";
import SchedulerGrid from './components/SchedulerGrid';
import SchedulerRows from './helper/SchedulerRows';

const initialState = {
  showScheduler: false,
  viewModel: {},
};

function reducer(state, action) {
  console.log('-----------------------------------REDUCER---------------------------');
  switch (action.type) {
    case 'INITIALIZE':
      return { showScheduler: true, viewModel: action.payload };
    case 'UPDATE_SCHEDULER':
      return { ...state, viewModel: action.payload };
    default:
      return state;
  }
}
let schedulerData;

function ReactJSchedule(props) {
    const { 
        headerTitleAttibute,
        headerTitleValue,

        scheduleDataSource,
        scheduleRowsDataSource,

        calendarDate,
        calendarDateFormat,
        calendarView,
        constraintsRender,

        onClickAction,
        onNewItemAction,

        style, 
        bootstrapStyle 
    } = props;
    
    const onClickHandler = useCallback((event) => {
        console.log(`Invoked click handler: {id: ${event.id}, title: ${event.title}}`);
        if (onClickAction && onClickAction.canExecute) {
            onClickAction.execute();
        }
    }, [onClickAction]);

    const onNewItemHandler = useCallback((event) => {
        console.log('neew item');
          if (onNewItemAction && onNewItemAction.canExecute) {
            onNewItemAction.execute();
        }
    }, [onNewItemAction]);
    //-------------------------------------------------------------------------------------------------
    const items = props.scheduleDataSource.items??[];

    const [state, dispatch] = useReducer(reducer, initialState);
    const [taskDndSource, setTaskDndSource] = useState(new DnDSource(props => props.task, TaskItem, true, DnDTypes.TASK));
    const [resourceDndSource, setResourceDndSource] = useState(new DnDSource(props => props.resource, ResourceItem, true, DnDTypes.RESOURCE));

    //-------------------------------------------------------------------------------------------------
    // INIT SCHEDULE DATA CLASS -> CONTROL OF WIDGET
    //-------------------------------------------------------------------------------------------------
    useEffect(() => {
    console.log('------------- SCHEDULER VARS START ------------');
    console.log('GENERAL --- ', headerTitleAttibute, headerTitleValue);
    console.log('DATASOURCE ---', scheduleDataSource, scheduleRowsDataSource);
    console.log('CALENDAR SETTINGS ---', calendarDate, calendarDateFormat, calendarView, constraintsRender);

    schedulerData = new SchedulerData(
      calendarDate, 
      getViewType(calendarView), 
      false, 
      false, 
      {
        schedulerMaxHeight: 500,
        besidesWidth: window.innerWidth <= 1600 ? 400 : 500,
        views: [
          { viewName: 'Agenda View', viewType: ViewType.Month, showAgenda: true, isEventPerspective: false },
          { viewName: 'Resource View', viewType: ViewType.Month, showAgenda: false, isEventPerspective: false },
          { viewName: 'Task View', viewType: ViewType.Month, showAgenda: false, isEventPerspective: true },
        ],
      });
    
    schedulerData.localeDayjs.locale('en');
    schedulerData.setResources(buildResources(scheduleRowsDataSource?.items));
    schedulerData.setEvents(DemoData.eventsForTaskView);

    dispatch({ type: 'INITIALIZE', payload: schedulerData });
    setTaskDndSource(new DnDSource(props => props.task, TaskItem, true, DnDTypes.TASK));
    setResourceDndSource(new DnDSource(props => props.resource, ResourceItem, true, DnDTypes.RESOURCE));

    return () => {
      schedulerData = null;
    };
  }, []);

  const getViewType = (config) =>{
    if(config==='year') return ViewType.Year;
    if(config==='quarter') return ViewType.Quarter;
    if(config==='month') return ViewType.Month;
    if(config==='week') return ViewType.Week;
    if(config==='day') return ViewType.Day;
  }
  const buildViewData = (verticals, items)=>{
      return {
        resources:buildResources(verticals),
        items:buildEvents(items)
      }
    };

    const buildEvents = items =>{
        return items?.map(item=>{ return buildEventItem(item)});
    }

    const buildEventItem = item =>{
      console.log('-------In Element',item);
      return {
        id: 1,
        start: '2022-12-18 09:30:00',
        end: '2022-12-19 23:30:00',
        resourceId: 'r1',
        title: 'I am finished',
        bgColor: '#D9D9D9',
        showPopover: false,
        type:1
      };
    };

    const buildResources = resources  => {
      console.info('-------------------building widget rows from ------------------', resources);
      if(resources) {
        return resources?.map(resitem=> {return buildResourceItem(resitem)});
      } else {
        console.info('-------------------building widget rows from DEFAULT ------------------');
        return [
          { id: 'r0', name: 'Resource0', title: 'Resource 0', groupOnly: true },
          { id: 'r1', name: 'Resource1', title: 'Resource 1', parentId: 'r0' },
          { id: 'r2', name: 'Resource2', parentId: 'r3' },
          { id: 'r3', name: 'Resource3', parentId: 'r1' },
          { id: 'r4', name: 'Resource4' },
          { id: 'r5', name: 'Resource5' },
          { id: 'r6', name: 'Resource6' },
          { id: 'r7', name: 'Resource7' },
        ]
      }
       
    };

    const buildResourceItem = (resitem, parent=null) => {
        return { id: 'r0', name: 'Resource0', title: 'Resource 0', groupOnly: true }
    };

  const prevClick = schedulerData => {
    schedulerData.prev();
    schedulerData.setEvents(DemoData.eventsForTaskView);
    this.setState({ viewModel: schedulerData });
  };

  const nextClick = schedulerData => {
    schedulerData.next();
    schedulerData.setEvents(DemoData.eventsForTaskView);
    dispatch({ type: 'UPDATE_SCHEDULER', payload: schedulerData });
  };

  const onViewChange = (schedulerData, view) => {
    schedulerData.setViewType(view.viewType, view.showAgenda, view.isEventPerspective);
    schedulerData.config.creatable = !view.isEventPerspective;
    schedulerData.setEvents(DemoData.eventsForTaskView);
    dispatch({ type: 'UPDATE_SCHEDULER', payload: schedulerData });
  };

  const onSelectDate = (schedulerData, date) => {
    schedulerData.setDate(date);
    schedulerData.setEvents(DemoData.eventsForTaskView);
    dispatch({ type: 'UPDATE_SCHEDULER', payload: schedulerData });
  };

  const eventClicked = (schedulerData, event) => {
    console.log(`You just clicked an event: {id: ${event.id}, title: ${event.title}}`);
    onClickHandler(event);
  };

  const ops1 = (schedulerData, event) => {
    alert(`You just executed ops1 to event: {id: ${event.id}, title: ${event.title}}`);
  };

  const ops2 = (schedulerData, event) => {
    alert(`You just executed ops2 to event: {id: ${event.id}, title: ${event.title}}`);
  };

  const newEvent = (schedulerData, slotId, slotName, start, end, type, item) => {
    if (confirm(`Do you want to create a new event? {slotId: ${slotId}, slotName: ${slotName}, start: ${start}, end: ${end}, type: ${type}, item: ${item}}`)) {
      let newFreshId = 0;
      schedulerData.events.forEach(item => {
        if (item.id >= newFreshId) newFreshId = item.id + 1;
      });

      let newEvent = {
        id: newFreshId,
        title: 'New event you just created',
        start,
        end,
        resourceId: slotId,
        bgColor: 'purple',
      };

      if (type === DnDTypes.RESOURCE) {
        newEvent = {
          ...newEvent,
          groupId: slotId,
          groupName: slotName,
          resourceId: item.id,
        };
      } else if (type === DnDTypes.TASK) {
        newEvent = {
          ...newEvent,
          groupId: item.id,
          groupName: item.name,
        };
      }

      schedulerData.addEvent(newEvent);
      dispatch({ type: 'UPDATE_SCHEDULER', payload: schedulerData });
    }
  };

  const updateEventStart = (schedulerData, event, newStart) => {
    if (confirm(`Do you want to adjust the start of the event? {eventId: ${event.id}, eventTitle: ${event.title}, newStart: ${newStart}}`)) {
      schedulerData.updateEventStart(event, newStart);
    }
    dispatch({ type: 'UPDATE_SCHEDULER', payload: schedulerData });
  };

  const updateEventEnd = (schedulerData, event, newEnd) => {
    if (confirm(`Do you want to adjust the end of the event? {eventId: ${event.id}, eventTitle: ${event.title}, newEnd: ${newEnd}}`)) {
      schedulerData.updateEventEnd(event, newEnd);
    }
    dispatch({ type: 'UPDATE_SCHEDULER', payload: schedulerData });
  };

  const moveEvent = (schedulerData, event, slotId, slotName, start, end) => {
    if (
      confirm(
        `Do you want to move the event? {eventId: ${event.id}, eventTitle: ${event.title}, newSlotId: ${slotId}, newSlotName: ${slotName}, newStart: ${start}, newEnd: ${end}`
      )
    ) {
      schedulerData.moveEvent(event, slotId, slotName, start, end);
      dispatch({ type: 'UPDATE_SCHEDULER', payload: schedulerData });
    }
  };

  const movingEvent = (schedulerData, slotId, slotName, newStart, newEnd, action, type, item) => {
    console.log('moving event', schedulerData, slotId, slotName, newStart, newEnd, action, type, item);
  };

  const subtitleGetter = (schedulerData, event) => (schedulerData.isEventPerspective ? schedulerData.getResourceById(event.resourceId).name : event.groupName);

  const toggleExpandFunc = (schedulerData, slotId) => {
    schedulerData.toggleExpandStatus(slotId);
    dispatch({ type: 'UPDATE_SCHEDULER', payload: schedulerData });
  };
    //-------------------------------------------------------------------------------------------------
    return (
    <DndProvider backend={HTML5Backend}>
    <div>
      {state.showScheduler && (
        <div>
          <Row align="middle" justify="center">
            <Typography.Title level={4}>
              {state.showScheduler
                && (state.viewModel?.isEventPerspective ? 'Drag a resource from outside and drop to the resource view.' : 'Drag a task from outside and drop to the resource view')}
            </Typography.Title>
          </Row>
          <Row>
            <Col span={22}>
              <SchedulerGrid schedulerData={state.viewModel}
                prevClick={prevClick}
                nextClick={nextClick}
                onSelectDate={onSelectDate}
                onViewChange={onViewChange}
                eventItemClick={eventClicked}
                viewEventClick={ops1}
                viewEventText="Ops 1"
                viewEvent2Text="Ops 2"
                viewEvent2Click={ops2}
                updateEventStart={updateEventStart}
                updateEventEnd={updateEventEnd}
                moveEvent={moveEvent}
                movingEvent={movingEvent}
                newEvent={newEvent}
                subtitleGetter={subtitleGetter}
                dndSources={[taskDndSource, resourceDndSource]}
                toggleExpandFunc={toggleExpandFunc}
              />
            </Col>
            <Col span={2}>
              {state.viewModel.isEventPerspective ? (
                <ResourceList schedulerData={state.viewModel} newEvent={newEvent} resourceDndSource={resourceDndSource} />
              ) : (
                <TaskList schedulerData={state.viewModel} newEvent={newEvent} taskDndSource={taskDndSource} />
              )}
            </Col>
          </Row>
        </div>
      )}
    </div>
    </DndProvider>
  );
}
export default ReactJSchedule;
/*
<Scheduler
                schedulerData={state.viewModel}
                prevClick={prevClick}
                nextClick={nextClick}
                onSelectDate={onSelectDate}
                onViewChange={onViewChange}
                eventItemClick={eventClicked}
                viewEventClick={ops1}
                viewEventText="Ops 1"
                viewEvent2Text="Ops 2"
                viewEvent2Click={ops2}
                updateEventStart={updateEventStart}
                updateEventEnd={updateEventEnd}
                moveEvent={moveEvent}
                movingEvent={movingEvent}
                newEvent={newEvent}
                subtitleGetter={subtitleGetter}
                dndSources={[taskDndSource, resourceDndSource]}
                toggleExpandFunc={toggleExpandFunc}
              />

              */
import React, { useState } from 'react';
import LabelIcon from '@material-ui/icons/Label';
import { useMediaQuery, Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
    MenuItemLink,
    getResources,
    useTranslate,
    DashboardMenuItem
} from 'react-admin';
import PropTypes from 'prop-types';
import { useSelector, shallowEqual } from 'react-redux';
import classnames from 'classnames';
import DefaultIcon from '@material-ui/icons/ViewList';
import CustomMenuItem from './CustomMenuItem';

const useStyles = makeStyles(
    theme => ({
        main: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            marginTop: '0.5em',
            [theme.breakpoints.only('xs')]: {
                marginTop: 0,
            },
            [theme.breakpoints.up('md')]: {
                marginTop: '1.5em',
            },
        },
    }),
    { name: 'RaTreeMenu' }
);

const Menu = (props) => {
    const {
        className,
        dense,
        hasDashboard,
        onMenuClick,
        logout,
        ...rest
    } = props;

    const classes = useStyles(props);
    const translate = useTranslate();
    const open = useSelector((state) => state.admin.ui.sidebarOpen);
    const pathname = useSelector((state) => state.router.location.pathname);
    const resources = useSelector(getResources, shallowEqual);
    const hasList = (resource) => (resource.hasList);

    const handleToggle = (parent) => {
        /**
         * Handles toggling of parents dropdowns
         * for resource visibility
         */
        setState(state => ({ [parent]: !state[parent] }));
    };

    const isXSmall = useMediaQuery((theme) =>
        /**
         * This function is not directly used anywhere
         * but is required to fix the following error:
         * 
         * Error: Rendered fewer hooks than expected.
         * This may be caused by an accidental early
         * return statement.
         * 
         * thrown by RA at the time of rendering.
         */
        theme.breakpoints.down('xs')
    );

    const isParent = (resource) => (
        /**
         * Check if the given resource is a parent
         * i.e. dummy resource for menu parenting
         */
        resource.options &&
        resource.options.hasOwnProperty('isMenuParent') &&
        resource.options.isMenuParent
    );

    const isOrphan = (resource) => (
        /**
         * Check if the given resource is an orphan
         * i.e. has no parents defined. Needed as
         * these resources are supposed to be rendered
         * as is
         *  
         */
        resource.options &&
        !resource.options.hasOwnProperty('menuParent') &&
        !resource.options.hasOwnProperty('isMenuParent')
    );

    const isChildOfParent = (resource, parentResource) => (
        /**
         * Returns true if the given resource is the
         * mapped child of the parentResource
         */
        resource.options &&
        resource.options.hasOwnProperty('menuParent') &&
        resource.options.menuParent == parentResource.name
    );

    const MenuItem = (resource) => (
        /**
         * Created and returns the MenuItemLink object component
         * for a given resource.
         */
        <MenuItemLink
            key={resource.name}
            to={`/${resource.name}`}
            primaryText={translate(resource.options.label)}
            leftIcon={
                resource.icon
                    ? <resource.icon />
                    : <DefaultIcon />
            }
            onClick={onMenuClick}
            dense={dense}
            sidebarIsOpen={open}
        />
    );

    /**
     * Mapping a "parent" entry and then all its children to the "tree" layout
     */
    const mapParentStack = (parentResource) =>
        <CustomMenuItem
            key={parentResource.name}
            handleToggle={() => handleToggle(parentResource.name)}
            isOpen={state[parentResource.name] || parentActiveResName === parentResource.name}
            sidebarIsOpen={open}
            name={parentResource.options.label}
            icon={parentResource.icon ? <parentResource.icon /> : <LabelIcon />}
            dense={dense}
        >
            {
                // eslint-disable-next-line
                resources
                    .filter((resource) => isChildOfParent(resource, parentResource) && hasList(resource))
                    .map((childResource) => { return MenuItem(childResource); })
            }
        </CustomMenuItem>;

    /**
     * Mapping independent (without a parent) entries
     */
    const mapIndependent = (independentResource) => MenuItem(independentResource);


    /**
     * Initialising the initialExpansionState and
     * active parent resource name at the time of
     * initial menu rendering.
     */
    const initialExpansionState = {};
    let parentActiveResName = null;

    /**
     * Initialise all parents to inactive first.
     * Also find the active resource name.
     */
    resources.forEach(resource => {
        if (isParent(resource)) {
            initialExpansionState[resource.name] = false;
        } else if (pathname.startsWith(`/${resource.name}`) && resource.options.hasOwnProperty('menuParent')) {
            parentActiveResName = resource.options.menuParent;
        }
    });

    const [state, setState] = useState(initialExpansionState);

    /**
     * The final array which will hold the array
     * of resources to be rendered
     */
    const resRenderGroup = [];

    /**
     * Looping over all resources and pushing the menu tree
     * for rendering in the order we find them declared in
     */
    resources.forEach(r => {
        if (isParent(r)) resRenderGroup.push(mapParentStack(r));
        if (isOrphan(r)) resRenderGroup.push(mapIndependent(r));
    });

    return (
        <div>
            <div
                className={classnames(classes.main, className)}
                {...rest}
            >
                {hasDashboard && (
                    <DashboardMenuItem
                        onClick={onMenuClick}
                        dense={dense}
                        sidebarIsOpen={open}
                    />
                )}
                {resRenderGroup}
            </div>
        </div>
    );
}

Menu.propTypes = {
    classes: PropTypes.object,
    className: PropTypes.string,
    dense: PropTypes.bool,
    hasDashboard: PropTypes.bool,
    logout: PropTypes.element,
    onMenuClick: PropTypes.func,
};

Menu.defaultProps = {
    onMenuClick: () => null
};


export default Menu;

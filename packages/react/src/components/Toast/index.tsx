import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';
import AriaIsolate from '../../utils/aria-isolate';
import { typeMap, tabIndexHandler } from './utils';
import setRef from '../../utils/setRef';

export interface ToastProps {
  type: 'confirmation' | 'caution' | 'action-needed' | 'info';
  onDismiss: () => void;
  dismissText?: string;
  toastRef: React.Ref<HTMLDivElement>;
  show?: boolean;
}

interface ToastState {
  animationClass: string;
  isolator?: AriaIsolate;
}

/**
 * The cauldron toast notification component
 */
export default class Toast extends React.Component<ToastProps, ToastState> {
  static defaultProps = {
    dismissText: 'Dismiss',
    onDismiss: () => {},
    toastRef: () => {},
    show: false
  };

  static propTypes = {
    // the ui to be added as the message of the toast
    children: PropTypes.node.isRequired,
    // "confirmation", "caution", or "action-needed"
    type: PropTypes.string.isRequired,
    // function to be exectued when toast is dismissed
    onDismiss: PropTypes.func,
    // text to be added as the aria-label of the "x" dismiss button (default: "Dismiss")
    dismissText: PropTypes.string,
    // an optional ref function to get a handle on the toast element
    toastRef: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.shape({ current: PropTypes.any })
    ]),
    // whether or not to show the toast
    show: PropTypes.bool
  };

  static displayName = 'Toast';

  private el: HTMLDivElement | null;

  constructor(props: ToastProps) {
    super(props);

    this.state = {
      animationClass: props.show ? 'FadeIn--flex' : 'is--hidden'
    };

    this.dismissToast = this.dismissToast.bind(this);
    this.showToast = this.showToast.bind(this);
  }

  componentDidMount() {
    const { show } = this.props;

    if (show) {
      // Timeout because CSS display: none/block and opacity:
      // 0/1 properties cannot be toggled in the same tick
      // see: https://codepen.io/isnerms/pen/eyQaLP
      setTimeout(this.showToast);
    }
  }

  componentDidUpdate(prevProps: ToastProps) {
    const { show } = this.props;
    if (prevProps.show !== show) {
      if (show) {
        this.setState({ animationClass: 'FadeIn--flex' }, () => {
          setTimeout(this.showToast);
        });
      } else {
        this.dismissToast();
      }
    }
  }

  render() {
    const { animationClass } = this.state;
    const { type, children, dismissText, toastRef, show } = this.props;
    const scrim =
      type === 'action-needed' && show ? (
        <div className="Scrim--light Scrim--show Scrim--fade-in" />
      ) : null;

    return (
      <React.Fragment>
        <div
          tabIndex={-1}
          className={`Toast Toast--${typeMap[type].className} ${animationClass}`}
          ref={el => {
            this.el = el;
            setRef(toastRef, el);
          }}
        >
          <div className="Toast__message">
            <Icon type={typeMap[type].icon} />
            <div className="Toast__message-content">{children}</div>
          </div>
          {type !== 'action-needed' && (
            <button
              type="button"
              className={'Toast__dismiss'}
              aria-label={dismissText}
              onClick={this.dismissToast}
            >
              <Icon type="close" />
            </button>
          )}
        </div>
        {scrim}
      </React.Fragment>
    );
  }

  dismissToast() {
    if (!this.el) {
      return;
    }
    const { onDismiss, type } = this.props;
    const { isolator } = this.state;

    this.setState(
      {
        animationClass: 'FadeIn--flex'
      },
      () => {
        // Timeout because CSS display: none/block and opacity:
        // 0/1 properties cannot be toggled in the same tick
        // see: https://codepen.io/isnerms/pen/eyQaLP
        setTimeout(() => {
          if (type === 'action-needed') {
            tabIndexHandler(true, this.el);
            isolator?.deactivate();
          }

          this.setState({ animationClass: 'is--hidden' }, onDismiss);
        });
      }
    );
  }

  showToast() {
    const { type } = this.props;

    this.setState(
      {
        animationClass: 'FadeIn--flex FadeIn'
      },
      () => {
        if (type === 'action-needed') {
          const isolator = new AriaIsolate(this.el as HTMLDivElement);
          tabIndexHandler(false, this.el);
          this.setState({ isolator });
          isolator.activate();
        }

        if (this.el) {
          // focus the toast
          this.el.focus();
        }
      }
    );
  }
}

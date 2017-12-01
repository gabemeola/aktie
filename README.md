# Aktie
Module State Management

Example Component

```js
import React, { Component } from 'react';
import { Protect } from 'components';
import { connect } from 'utils/predux';


class ProtectContainer extends Component {
    constructor(props) {
        super();
        
        this.changeName = this.changeName.bind(this);
    } 
    changeName() {
        this.props.predux.setValue('name', `gabe-${Math.random()}`);
    }
    render() {
        return (
            <div>
                <h1 onClick={changeName}>Name = {this.props.name}</h1>
                <Protect />
            </div>
        )
    }
}


export default connect([
    'name'
])(ProtectContainer);
```

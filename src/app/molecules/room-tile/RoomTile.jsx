import React from 'react';
import PropTypes from 'prop-types';

import { twemojify } from '../../../util/twemojify';

import { colorMXID } from '../../../util/colorMXID';

import Text from '../../atoms/text/Text';
import Avatar from '../../atoms/avatar/Avatar';

function RoomTile({
  avatarSrc, name, id,
  inviterName, memberCount, desc, options,
}) {
  return (
    <div className="room-tile">
      <div className="room-tile__avatar">
        <Avatar
          imageSrc={avatarSrc}
          bgColor={colorMXID(id)}
          text={name}
          isDefaultImage
        />
      </div>
      <div className="room-tile__content emoji-size-fix">
        <Text variant="s1">{twemojify(name)}</Text>
        <div className="very-small text-gray">
          {
            inviterName !== null
              ? `Invited by ${inviterName} to ${id}${memberCount === null ? '' : ` • ${memberCount} members`}`
              : id + (memberCount === null ? '' : ` • ${memberCount} members`)
          }
        </div>
        {
          desc !== null && (typeof desc === 'string')
            ? <Text className="room-tile__content__desc emoji-size-fix" variant="b2">{twemojify(desc, undefined, true)}</Text>
            : desc
        }
      </div>
      {options !== null && (
        <div className="room-tile__options">
          {options}
        </div>
      )}
    </div>
  );
}

RoomTile.defaultProps = {
  avatarSrc: null,
  inviterName: null,
  options: null,
  desc: null,
  memberCount: null,
};
RoomTile.propTypes = {
  avatarSrc: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  inviterName: PropTypes.string,
  memberCount: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  desc: PropTypes.node,
  options: PropTypes.node,
};

export default RoomTile;

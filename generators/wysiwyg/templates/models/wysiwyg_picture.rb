class WysiwygPicture < ActiveRecord::Base

  has_attached_file :file,
    :path => ":rails_root/public/system/wysiwyg_pictures/:id/:style.:extension",
    :url  => "/system/wysiwyg_pictures/:id/:style.:extension",
    :styles => {
      :thumb => "100x75>",
    }

  validates_attachment_presence     :file
  validates_attachment_size         :file, :in => 0..5.megabyte
  validates_attachment_content_type :file,
    :content_type => [ 'image/jpg', 'image/jpeg', 'image/jpe', 'image/png' ]
end

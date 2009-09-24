class WysiwygPicturesController < ActionController::Base
  skip_before_filter :verify_authenticity_token
  
  def create
    # wysiwyg will send X POST requests when uploading a picture. X = the number of wysiwyg editors in the page.
    if params[:file]
      @picture = WysiwygPicture.new(:file => params[:file])
      @wysiwyg_id = params[:wysiwyg_id]
      respond_to do |format|      
        format.js { @picture.save ? render_success : render_failure }
      end
    else
      render :text => ""
    end
  end
  
  def render_success
    responds_to_parent do
      render :js => "wysiwyg.#{@wysiwyg_id}.editor_cmd('insertImage', '#{@picture.file.url}'); $.unblockUI();"
    end
  end
  
  def render_failure
    responds_to_parent do
      render :js => "alert('Upload Failed.'); $.unblockUI();"
    end
  end
end